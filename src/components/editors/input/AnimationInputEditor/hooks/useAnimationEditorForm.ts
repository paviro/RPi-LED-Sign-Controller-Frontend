'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  fetchPlaylistItem,
  createPlaylistItem,
  updatePlaylistItem
} from '../../../../../lib/api';
import {
  AnimationContentDetails,
  AnimationPreset,
  BorderEffect,
  ContentType,
  PlaylistItem,
  RGBColor
} from '../../../../../types';

const clonePalette = (palette?: RGBColor[]): RGBColor[] => {
  if (!palette || palette.length === 0) {
    return [
      [255, 90, 90],
      [64, 156, 255],
      [255, 230, 92]
    ];
  }
  return palette.map((color) => [...color] as RGBColor);
};

export const createDefaultAnimationContent = (
  preset: AnimationPreset = 'Pulse',
  palette?: RGBColor[]
): AnimationContentDetails => {
  const colors = clonePalette(palette);

  switch (preset) {
    case 'PaletteWave':
      return {
        type: 'Animation',
        preset: 'PaletteWave',
        colors,
        cycle_ms: 2500,
        wave_count: 3
      };
    case 'DualPulse':
      return {
        type: 'Animation',
        preset: 'DualPulse',
        colors,
        cycle_ms: 2300,
        phase_offset: 0.5
      };
    case 'ColorFade':
      return {
        type: 'Animation',
        preset: 'ColorFade',
        colors,
        drift_speed: 0.25
      };
    case 'Strobe':
      return {
        type: 'Animation',
        preset: 'Strobe',
        colors,
        flash_ms: 180,
        fade_ms: 220,
        randomize: false,
        randomization_factor: 0.35
      };
    case 'Sparkle':
      return {
        type: 'Animation',
        preset: 'Sparkle',
        colors,
        density: 0.12,
        twinkle_ms: 600
      };
    case 'Plasma':
      return {
        type: 'Animation',
        preset: 'Plasma',
        colors,
        flow_speed: 1.85,
        noise_scale: 1.75
      };
    case 'MosaicTwinkle':
      return {
        type: 'Animation',
        preset: 'MosaicTwinkle',
        colors,
        tile_size: 1,
        flow_speed: 0.35,
        border_size: 0,
        border_color: [50, 0, 0]
      };
    case 'Pulse':
    default:
      return {
        type: 'Animation',
        preset: 'Pulse',
        colors,
        cycle_ms: 2000
      };
  }
};

const isAnimationContent = (
  content?: PlaylistItem['content']
): content is { type: ContentType.Animation; data: AnimationContentDetails } =>
  content?.type === ContentType.Animation && content.data.type === 'Animation';

const ensureAnimationDefaults = (
  content: AnimationContentDetails
): AnimationContentDetails => {
  if (content.preset === 'MosaicTwinkle') {
    const tileSize =
      typeof content.tile_size === 'number' ? Math.max(1, content.tile_size) : 1;
    const maxBorder = Math.max(0, tileSize - 1);
    const rawBorder =
      typeof content.border_size === 'number' ? content.border_size : 0;
    return {
      ...content,
      tile_size: tileSize,
      border_size: Math.max(0, Math.min(rawBorder, maxBorder)),
      border_color: content.border_color ?? [50, 0, 0]
    };
  }
  if (content.preset === 'Strobe') {
    const randomizationFactor =
      typeof content.randomization_factor === 'number'
        ? Math.min(1, Math.max(0, content.randomization_factor))
        : 0.35;
    return {
      ...content,
      randomize: Boolean(content.randomize),
      randomization_factor: randomizationFactor
    };
  }
  if (content.preset === 'Plasma') {
    const flowSpeed =
      typeof content.flow_speed === 'number' && Number.isFinite(content.flow_speed)
        ? Math.max(0.05, content.flow_speed)
        : 1.85;
    const noiseScale =
      typeof content.noise_scale === 'number' && Number.isFinite(content.noise_scale)
        ? Math.max(0.2, content.noise_scale)
        : 1.75;
    return {
      ...content,
      flow_speed: flowSpeed,
      noise_scale: noiseScale
    };
  }
  return content;
};

interface UseAnimationEditorFormProps {
  itemId: string | null;
  onSuccess: () => void;
}

export function useAnimationEditorForm({
  itemId,
  onSuccess
}: UseAnimationEditorFormProps) {
  const [form, setForm] = useState<Partial<PlaylistItem>>({
    duration: 10,
    border_effect: { None: null },
    content: {
      type: ContentType.Animation,
      data: createDefaultAnimationContent()
    }
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{
    message: string;
    type: 'error' | 'success' | 'info';
  } | null>(null);
  const [isNewItem, setIsNewItem] = useState(true);
  const initialLoadRef = useRef(false);

  useEffect(() => {
    const loadItem = async () => {
      if (!itemId || initialLoadRef.current) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const item = await fetchPlaylistItem(itemId);
        if (!isAnimationContent(item.content)) {
          setStatus({
            message: 'Selected playlist item is not an animation entry.',
            type: 'error'
          });
          setLoading(false);
          return;
        }

        setForm({
          ...item,
          repeat_count: undefined
        });
        setIsNewItem(false);
        initialLoadRef.current = true;
      } catch (error) {
        setStatus({
          message: `Error loading item: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`,
          type: 'error'
        });
      } finally {
        setLoading(false);
      }
    };

    loadItem();
  }, [itemId]);

  const animationContent = useMemo<AnimationContentDetails>(() => {
    if (isAnimationContent(form.content)) {
      return ensureAnimationDefaults(form.content.data);
    }
    return createDefaultAnimationContent();
  }, [form.content]);

  const setAnimationContent = useCallback(
    (updater: (current: AnimationContentDetails) => AnimationContentDetails) => {
      setForm((prev) => {
        const current = isAnimationContent(prev.content)
          ? ensureAnimationDefaults(prev.content.data)
          : createDefaultAnimationContent();
        return {
          ...prev,
          content: {
            type: ContentType.Animation,
            data: updater(current)
          }
        };
      });
    },
    []
  );

  const updateDuration = useCallback((duration: number) => {
    setForm((prev) => ({
      ...prev,
      duration: Math.max(1, duration)
    }));
  }, []);

  const saveItem = useCallback(
    async (borderEffect: BorderEffect | null | undefined) => {
      if (!animationContent.colors || animationContent.colors.length === 0) {
        setStatus({
          message: 'Add at least one color to the palette.',
          type: 'error'
        });
        return;
      }

      setSaving(true);
      try {
        const itemToSave: Partial<PlaylistItem> = {
          duration: form.duration ? Math.max(1, form.duration) : 10,
          border_effect: borderEffect ?? null,
          content: {
            type: ContentType.Animation,
            data: animationContent
          }
        };

        if (isNewItem) {
          await createPlaylistItem(itemToSave);
        } else if (itemId) {
          await updatePlaylistItem(itemId, {
            ...itemToSave,
            id: itemId
          });
        }

        onSuccess();
      } catch (error) {
        setStatus({
          message: `Error saving item: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`,
          type: 'error'
        });
      } finally {
        setSaving(false);
      }
    },
    [animationContent, form.duration, isNewItem, itemId, onSuccess]
  );

  return {
    form,
    setForm,
    animationContent,
    setAnimationContent,
    updateDuration,
    loading,
    saving,
    status,
    setStatus,
    isNewItem,
    saveItem
  };
}

