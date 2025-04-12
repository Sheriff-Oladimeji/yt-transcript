"use client";

import { useEffect, useState } from "react";
import { useTranscriptStore } from "@/store/transcript-store";
import { EmbeddedVideo } from "@/components/embedded-video";
import TranscriptViewer from "@/components/transcript/transcript-viewer";
import TranscriptHeader from "@/components/transcript/transcript-header";
import ActionButtons from "@/components/transcript/action-buttons";
import TranslationSettings from "@/components/transcript/translation-settings";
// Removed unused tabs imports
import { use } from "react";

export default function TranscriptPage({
  params,
}: {
  params: Promise<{ videoId: string }>;
}) {
  const resolvedParams = use(params);
  const { videoId } = resolvedParams;

  const {
    fetchTranscriptData,
    isLoading,
    error,
    transcript,
    videoTitle,
    translationTarget,
  } = useTranscriptStore();

  useEffect(() => {
    if (videoId) {
      fetchTranscriptData(videoId);
    }
  }, [videoId, fetchTranscriptData]);

  const [showTranslationSettings, setShowTranslationSettings] = useState(false);

  return (
    <main className="flex flex-col min-h-screen bg-background">
      {/* Video Section */}
      <EmbeddedVideo videoId={videoId} />

      <div className="w-full max-w-[800px] mx-auto px-4 py-6">
        {/* Transcript Header */}
        <TranscriptHeader
          videoId={videoId}
          title={videoTitle}
          isLoading={isLoading}
          error={error}
        />

        {/* Action Buttons */}
        <ActionButtons
          videoId={videoId}
          onTranslateClick={() =>
            setShowTranslationSettings(!showTranslationSettings)
          }
        />

        {/* Translation Settings (conditionally shown) */}
        {showTranslationSettings && <TranslationSettings />}

        {/* Transcript Content */}
        <TranscriptViewer
          videoId={videoId}
          transcript={transcript}
          isLoading={isLoading}
          error={error}
          isTranslated={!!translationTarget}
        />
      </div>
    </main>
  );
}
