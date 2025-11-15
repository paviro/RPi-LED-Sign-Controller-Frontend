'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ContentType,
  PlaylistItem,
  ClockContentDetails,
  ClockFormat,
  RGBColor,
  BorderEffect
} from '../../../../../types';
import {
  fetchPlaylistItem,
  createPlaylistItem,
  updatePlaylistItem
} from '../../../../../lib/api';
import { useBorderEffects } from '../../../features/BorderEffectSelector/hooks/useBorderEffects';

type StatusMessage = { message: string; type: 'error' | 'success' | 'info' } | null;

interface UseClockEditorFormProps {
  itemId: string | null;
  onSuccess?: () => void;
}

interface UseClockEditorFormResult {
  loading: boolean;
  saving: boolean;
  status: StatusMessage;
  duration: number;
  clockSettings: ClockContentDetails;
  updateDuration: (value: number) => void;
  updateFormat: (format: ClockFormat) => void;
  updateShowSeconds: (value: boolean) => void;
  updateColor: (color: RGBColor) => void;
  borderEffectType: string;
  gradientColors: RGBColor[];
  handleBorderEffectChange: (effect: string) => void;
  handleAddGradientColor: () => void;
  handleRemoveGradientColor: (index: number) => void;
  handleGradientColorEdit: (index: number, value: RGBColor) => void;
  getBorderEffectObject: () => BorderEffect;
  saveItem: () => Promise<void>;
}

const createDefaultClockContent = (): ClockContentDetails => ({
  type: 'Clock',
  format: '24h',
  show_seconds: false,
  color: [255, 255, 255]
});

const createDefaultForm = (): Partial<PlaylistItem> => ({
  duration: 10,
  border_effect: { None: null },
  content: {
    type: ContentType.Clock,
    data: createDefaultClockContent()
  }
});

const isClockContent = (
  content?: PlaylistItem['content']
): content is { type: ContentType.Clock; data: ClockContentDetails } =>
  content?.type === ContentType.Clock && content.data.type === 'Clock';

export function useClockEditorForm({
  itemId,
  onSuccess
}: UseClockEditorFormProps): UseClockEditorFormResult {
  const [form, setForm] = useState<Partial<PlaylistItem>>(() => createDefaultForm());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<StatusMessage>(null);
  const [isNewItem, setIsNewItem] = useState(true);

  const clockSettings = useMemo<ClockContentDetails>(() => {
    if (isClockContent(form.content)) {
      return form.content.data;
    }
    return createDefaultClockContent();
  }, [form.content]);

  const {
    borderEffectType,
    setBorderEffectType,
    gradientColors,
    handleAddGradientColor,
    handleRemoveGradientColor,
    handleGradientColorEdit,
    getBorderEffectObject
  } = useBorderEffects(form.border_effect || undefined);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        if (itemId) {
          const item = await fetchPlaylistItem(itemId);
          if (cancelled) {
            return;
          }
          if (!isClockContent(item.content)) {
            setStatus({
              message: 'Selected playlist item is not a clock entry.',
              type: 'error'
            });
            setForm(createDefaultForm());
            setIsNewItem(true);
          } else {
            setForm(item);
            setIsNewItem(false);
          }
        } else {
          setForm(createDefaultForm());
          setIsNewItem(true);
        }
      } catch (error) {
        if (!cancelled) {
          setStatus({
            message: `Error loading item: ${
              error instanceof Error ? error.message : 'Unknown error'
            }`,
            type: 'error'
          });
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [itemId]);

  const updateDuration = useCallback((value: number) => {
    setForm((prev) => ({
      ...prev,
      duration: Math.max(1, Math.round(Number(value) || 1))
    }));
  }, []);

  const updateFormat = useCallback((format: ClockFormat) => {
    setForm((prev) => {
      if (!isClockContent(prev.content)) {
        return prev;
      }
      return {
        ...prev,
        content: {
          ...prev.content,
          data: {
            ...prev.content.data,
            format
          }
        }
      };
    });
  }, []);

  const updateShowSeconds = useCallback((showSeconds: boolean) => {
    setForm((prev) => {
      if (!isClockContent(prev.content)) {
        return prev;
      }
      return {
        ...prev,
        content: {
          ...prev.content,
          data: {
            ...prev.content.data,
            show_seconds: showSeconds
          }
        }
      };
    });
  }, []);

  const updateColor = useCallback((color: RGBColor) => {
    setForm((prev) => {
      if (!isClockContent(prev.content)) {
        return prev;
      }
      return {
        ...prev,
        content: {
          ...prev.content,
          data: {
            ...prev.content.data,
            color: [color[0], color[1], color[2]] as RGBColor
          }
        }
      };
    });
  }, []);

  const handleBorderEffectChange = useCallback(
    (effect: string) => {
      setBorderEffectType(effect);
    },
    [setBorderEffectType]
  );

  const saveItem = useCallback(async () => {
    setSaving(true);
    try {
      const borderEffect = getBorderEffectObject();
      const payload: Partial<PlaylistItem> = {
        duration: Math.max(1, Math.round(form.duration ?? 10)),
        border_effect: borderEffect,
        content: {
          type: ContentType.Clock,
          data: {
            type: 'Clock',
            format: clockSettings.format,
            show_seconds: clockSettings.show_seconds,
            color: [clockSettings.color[0], clockSettings.color[1], clockSettings.color[2]] as RGBColor
          }
        }
      };

      if (isNewItem) {
        await createPlaylistItem(payload);
      } else if (itemId) {
        await updatePlaylistItem(itemId, payload);
      }

      setStatus({ message: 'Playlist item saved', type: 'success' });
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
  }, [
    clockSettings.color,
    clockSettings.format,
    clockSettings.show_seconds,
    form.duration,
    getBorderEffectObject,
    isNewItem,
    itemId,
    onSuccess,
    getBorderEffectObject
  ]);

  return {
    loading,
    saving,
    status,
    duration: form.duration ?? 10,
    clockSettings,
    updateDuration,
    updateFormat,
    updateShowSeconds,
    updateColor,
    borderEffectType,
    gradientColors,
    handleBorderEffectChange,
    handleAddGradientColor,
    handleRemoveGradientColor,
    handleGradientColorEdit,
    getBorderEffectObject,
    saveItem
  };
}

