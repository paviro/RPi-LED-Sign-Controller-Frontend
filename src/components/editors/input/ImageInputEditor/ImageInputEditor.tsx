'use client';

import { useCallback, useEffect, useMemo } from 'react';
import BorderEffectSelector from '../../features/BorderEffectSelector/BorderEffectSelector';
import NumberInputControl from '../../common/NumberInputControl';
import ImagePreviewPanel from './components/ImagePreviewPanel';
import AnimationToggle from './components/animation/AnimationToggle';
import TimelineScrubber from './components/animation/TimelineScrubber';
import KeyframeList from './components/animation/KeyframeList';
import { useImageEditorForm } from './hooks/useImageEditorForm';

interface ImageInputEditorProps {
  itemId: string | null;
  updateStatus: (status: { message: string; type: 'error' | 'success' | 'info' } | null) => void;
  updateSaving: (saving: boolean) => void;
  updateLoading: (loading: boolean) => void;
  onBack?: () => void;
  registerExitPreview?: (exitFn: () => void) => void;
}

export default function ImageInputEditor({
  itemId,
  updateStatus,
  updateSaving,
  updateLoading,
  onBack,
  registerExitPreview
}: ImageInputEditorProps) {
  const handleSuccess = useCallback(() => {
    if (onBack) {
      onBack();
    }
  }, [onBack]);

  const {
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
  } = useImageEditorForm({
    itemId,
    onSuccess: handleSuccess,
    registerExitPreview
  });

  useEffect(() => {
    updateSaving(saving);
  }, [saving, updateSaving]);

  useEffect(() => {
    updateLoading(loading);
  }, [loading, updateLoading]);

  useEffect(() => {
    if (status) {
      updateStatus(status);
    }
  }, [status, updateStatus]);

  const keyframes = imageData?.animation?.keyframes;
  const timelineMinSeconds = useMemo(() => {
    if (!keyframes?.length) {
      return 1;
    }
    const lastKeyframe = keyframes[keyframes.length - 1];
    return Math.max(1, Math.ceil(lastKeyframe.timestamp_ms / 1000));
  }, [keyframes]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40">
        <div className="text-center">
          <div className="animate-spin inline-block w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full mb-2"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading editor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ImagePreviewPanel
        panelInfo={panelInfo}
        imageData={imageData}
        previewImageUrl={previewImageUrl}
        renderTransform={animation.renderTransform}
        minScale={animation.minScale}
        uploading={uploading}
        isPlaying={animation.isPlaying}
        onScaleChange={(value) => animation.updateTransform('scale', value)}
        onTransformChange={animation.applyTransformChange}
        onFileSelect={handleFileChange}
      />

      <div className="border-t border-gray-200 dark:border-gray-700 pt-6 my-6">
        <AnimationToggle
          enabled={!!imageData?.animation}
          disabled={!imageData}
          onEnable={animation.ensureAnimation}
          onDisable={animation.disableAnimation}
        />

        {imageData?.animation ? (
          <div className="space-y-4 transition-all duration-300 ease-in-out">
            <TimelineScrubber
              timelineMs={animation.timelineMs}
              timelineLengthSec={animation.timelineLengthSec}
              keyframes={keyframes}
              isPlaying={animation.isPlaying}
              canPlay={(keyframes?.length ?? 0) >= 2}
              onScrub={animation.handleTimelineScrub}
              onStartPlayback={animation.startPlayback}
              onStopPlayback={animation.stopPlayback}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <NumberInputControl
                label="Number of Repeats"
                value={imageData.animation.iterations ?? form.repeat_count ?? 1}
                onChange={animation.handleIterationsChange}
                suffix="times"
                minValue={0}
                defaultValue={1}
                className="mb-0"
              />
              <NumberInputControl
                label="Timeline Length"
                value={animation.timelineLengthSec}
                onChange={animation.handleTimelineLengthChange}
                suffix="seconds"
                minValue={timelineMinSeconds}
                maxValue={60}
                defaultValue={5}
                className="mb-0"
              />
            </div>

            <KeyframeList
              keyframes={keyframes}
              timelineMs={animation.timelineMs}
              onSkipToKeyframe={animation.handleTimelineScrub}
              onMoveToCurrent={animation.handleKeyframeTimeSetToCurrent}
              onRemove={animation.handleRemoveKeyframe}
              onAddKeyframe={animation.handleAddKeyframe}
              onClearAll={animation.resetAnimationToDefault}
            />
          </div>
        ) : (
          <div className="transition-all duration-300 ease-in-out overflow-hidden">
            <NumberInputControl
              label="Duration (seconds)"
              value={form.duration || 10}
              onChange={handleDurationChange}
              suffix="seconds"
              minValue={1}
              defaultValue={10}
            />
          </div>
        )}
      </div>

      <BorderEffectSelector
        selectedEffect={borderEffectType}
        onEffectChange={handleBorderEffectChange}
        gradientColors={gradientColors}
        onGradientColorChange={handleGradientColorEdit}
        onAddGradientColor={handleAddGradientColor}
        onRemoveGradientColor={handleRemoveGradientColor}
      />
    </div>
  );
}

