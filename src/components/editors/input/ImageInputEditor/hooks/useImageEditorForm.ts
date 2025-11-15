import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  fetchPlaylistItem,
  createPlaylistItem,
  updatePlaylistItem,
  uploadImage,
  getImageUrl,
  fetchDisplayInfo
} from '../../../../../lib/api';
import { ContentType, PlaylistItem, DisplayInfo, RGBColor } from '../../../../../types';
import { useBorderEffects } from '../../../features/BorderEffectSelector/hooks/useBorderEffects';
import { EditorStatus, ImageDetails, Transform } from '../types';
import { sanitizeTransform } from '../utils';
import { useImageAnimationControls, ImageAnimationControls } from './useImageAnimationControls';

interface UseImageEditorFormParams {
  itemId: string | null;
  onSuccess?: () => void;
  registerExitPreview?: (exitFn: () => void) => void;
}

export interface ImageEditorFormResult {
  form: Partial<PlaylistItem>;
  imageData: ImageDetails | null;
  panelInfo: DisplayInfo | null;
  loading: boolean;
  saving: boolean;
  uploading: boolean;
  status: EditorStatus | null;
  previewImageUrl: string | null;
  borderEffectType: string;
  gradientColors: RGBColor[];
  animation: ImageAnimationControls;
  handleFileChange: (files: FileList | null) => Promise<void>;
  handleBorderEffectChange: (effect: string) => void;
  handleDurationChange: (value: number) => void;
  handleAddGradientColor: () => void;
  handleRemoveGradientColor: (index: number) => void;
  handleGradientColorEdit: (index: number, value: RGBColor) => void;
}

const defaultImageForm: Partial<PlaylistItem> = {
  duration: 10,
  border_effect: null,
  content: {
    type: ContentType.Image,
    data: {
      type: 'Image',
      image_id: '',
      natural_width: 0,
      natural_height: 0,
      transform: { x: 0, y: 0, scale: 1 },
      animation: null
    }
  }
};

const cloneDefaultForm = (): Partial<PlaylistItem> => {
  if (!defaultImageForm.content) {
    return { ...defaultImageForm };
  }

  const { content } = defaultImageForm;

  if (content.data.type === 'Image') {
    return {
  ...defaultImageForm,
      content: {
        ...content,
        data: {
          ...content.data,
          transform: { ...content.data.transform }
        }
      }
    };
  }

  return {
    ...defaultImageForm,
    content: {
      ...content,
      data: { ...content.data }
    }
  };
};

export function useImageEditorForm({
  itemId,
  onSuccess,
  registerExitPreview
}: UseImageEditorFormParams): ImageEditorFormResult {
  const [form, setForm] = useState<Partial<PlaylistItem>>(cloneDefaultForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [panelInfo, setPanelInfo] = useState<DisplayInfo | null>(null);
  const [status, setStatus] = useState<EditorStatus | null>(null);

  const imageData = useMemo<ImageDetails | null>(() => {
    if (form.content?.type === ContentType.Image && form.content.data.type === 'Image') {
      return form.content.data as ImageDetails;
    }
    return null;
  }, [form]);

  const previewImageUrl = useMemo(() => {
    if (imageData?.image_id) {
      return getImageUrl(imageData.image_id);
    }
    return null;
  }, [imageData?.image_id]);

  const computeDefaultTransform = useCallback(
    (data?: ImageDetails | null): Transform => {
      if (!data) {
        return { x: 0, y: 0, scale: 1 };
      }

      if (!panelInfo) {
        return sanitizeTransform(data.transform);
      }

      const width = Math.max(1, data.natural_width);
      const height = Math.max(1, data.natural_height);
      const fitScale = Math.min(panelInfo.width / width, panelInfo.height / height, 1);

      let x = 0;
      let y = 0;

      if (fitScale < 1) {
        const scaledWidth = width * fitScale;
        const scaledHeight = height * fitScale;
        x = Math.round((panelInfo.width - scaledWidth) / 2);
        y = Math.round((panelInfo.height - scaledHeight) / 2);
      }

      return sanitizeTransform({ x, y, scale: fitScale });
    },
    [panelInfo]
  );

  const {
    borderEffectType,
    setBorderEffectType,
    gradientColors,
    handleAddGradientColor,
    handleRemoveGradientColor,
    handleGradientColorEdit,
    getBorderEffectObject
  } = useBorderEffects(form.border_effect || undefined);

  const selectedBorderEffect = useMemo(
    () => getBorderEffectObject(),
    [getBorderEffectObject]
  );

  const animation = useImageAnimationControls({
    form,
    setForm,
    imageData,
    panelInfo,
    selectedBorderEffect,
    computeDefaultTransform,
    registerExitPreview,
    loading,
    uploading
  });
  const {
    refreshRemotePreview,
    stopRemotePreview,
    ensureVirtualTimelineAnimation
  } = animation;

  const handleFileChange = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;
      const file = files[0];
      setUploading(true);
      try {
        const response = await uploadImage(file);
        const nextImageData: ImageDetails = {
          type: 'Image',
          image_id: response.image_id,
          natural_width: response.width,
          natural_height: response.height,
          transform: { x: 0, y: 0, scale: 1 },
          animation: null
        };

        const initialTransform = computeDefaultTransform(nextImageData);

        setForm((prev) => ({
          ...prev,
          content: {
            type: ContentType.Image,
            data: {
              ...nextImageData,
              transform: initialTransform,
              animation: prev.content?.data.type === 'Image' ? prev.content.data.animation : null
            }
          }
        }));
        setStatus({ message: 'Image uploaded successfully', type: 'success' });
      } catch (error) {
        setStatus({
          message: `Failed to upload image: ${error instanceof Error ? error.message : 'Unknown error'}`,
          type: 'error'
        });
      } finally {
        setUploading(false);
      }
    },
    [computeDefaultTransform]
  );

  const handleBorderEffectChange = useCallback(
    (effect: string) => {
      setBorderEffectType(effect);
      refreshRemotePreview();
    },
    [refreshRemotePreview, setBorderEffectType]
  );

  const handleDurationChange = useCallback((value: number) => {
    setForm((prev) => ({
      ...prev,
      duration: Math.max(1, Math.round(value))
    }));
  }, []);

  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      try {
        setLoading(true);
        const displayPromise = fetchDisplayInfo();

        if (itemId) {
          const [display, item] = await Promise.all([displayPromise, fetchPlaylistItem(itemId)]);
          if (!isMounted) return;
          setPanelInfo(display);
          setForm(item);
        } else {
          const display = await displayPromise;
          if (!isMounted) return;
          setPanelInfo(display);
          setForm(cloneDefaultForm());
        }
      } catch (error) {
        if (isMounted) {
          setStatus({
            message: `Error loading editor: ${error instanceof Error ? error.message : 'Unknown error'}`,
            type: 'error'
          });
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadData();
    return () => {
      isMounted = false;
    };
  }, [itemId]);

  useEffect(() => {
    const handleSave = async () => {
      if (!imageData || !imageData.image_id) {
        setStatus({ message: 'Please upload an image first', type: 'error' });
        return;
      }

      setSaving(true);
      try {
        const payload: Partial<PlaylistItem> = (() => {
          if (form.content?.type !== ContentType.Image || form.content.data.type !== 'Image') {
            return form;
          }
          const animationWithVirtual = ensureVirtualTimelineAnimation(form.content.data.animation);
          if (!animationWithVirtual || animationWithVirtual === form.content.data.animation) {
            return form;
          }
          return {
            ...form,
            content: {
              ...form.content,
              data: {
                ...form.content.data,
                animation: animationWithVirtual
              }
            }
          };
        })();
        payload.border_effect = selectedBorderEffect;

        if (itemId) {
          await updatePlaylistItem(itemId, payload);
        } else {
          await createPlaylistItem(payload);
        }
        setStatus({ message: 'Playlist item saved', type: 'success' });
        stopRemotePreview();
        if (onSuccess) {
          onSuccess();
        }
      } catch (error) {
        setStatus({
          message: `Error saving item: ${error instanceof Error ? error.message : 'Unknown error'}`,
          type: 'error'
        });
      } finally {
        setSaving(false);
      }
    };

    const listener = () => {
      void handleSave();
    };

    document.addEventListener('editor-save', listener);
    return () => {
      document.removeEventListener('editor-save', listener);
    };
  }, [
    ensureVirtualTimelineAnimation,
    form,
    imageData,
    itemId,
    onSuccess,
    selectedBorderEffect,
    stopRemotePreview
  ]);

  return {
    form,
    imageData,
    panelInfo,
    loading,
    saving,
    uploading,
    status,
    previewImageUrl,
    borderEffectType,
    gradientColors,
    animation,
    handleFileChange,
    handleBorderEffectChange,
    handleDurationChange,
    handleAddGradientColor,
    handleRemoveGradientColor,
    handleGradientColorEdit
  };
}


