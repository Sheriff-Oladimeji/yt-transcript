"use client";

import { useEffect, useState } from "react";
import { useTranscriptStore } from "@/store/transcript-store";

import { EmbeddedVideo } from "@/components/embedded-video";
import TranscriptViewer from "@/components/transcript/transcript-viewer";
import TranscriptHeader from "@/components/transcript/transcript-header";
import ActionButtons from "@/components/transcript/action-buttons";
import TranslationSettings from "@/components/transcript/translation-settings";
import TranscriptGenerator from "@/components/transcript/transcript-generator";
import ShareButtons from "@/components/share-buttons";
// Removed unused tabs imports
import { use } from "react";

export default function TranscriptPage({
  params,
}: {
  params: Promise<{ videoId: string }>;
}) {
  const resolvedParams = use(params);
  const { videoId } = resolvedParams;

  const { fetchTranscriptData, isLoading, error, transcript, videoTitle } =
    useTranscriptStore();

  useEffect(() => {
    if (videoId) {
      // Check if we already have data for this video to avoid duplicate calls
      const currentVideoId = useTranscriptStore.getState().videoId;
      if (currentVideoId !== videoId) {
        fetchTranscriptData(videoId);
      }
    }
  }, [videoId, fetchTranscriptData]);

  const [showTranslationSettings, setShowTranslationSettings] = useState(false);

  return (
    <main className="flex flex-col min-h-screen bg-background relative">
      {/* Share Buttons */}
      <ShareButtons title={videoTitle || `Transcript of YouTube Video`} />

      {/* Transcript Generator */}
      <TranscriptGenerator />

      {/* Video Section */}
      <EmbeddedVideo videoId={videoId} />

      <div className="w-full max-w-[800px] mx-auto px-4 py-6 pb-24 md:pb-6">
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
          transcript={transcript}
          isLoading={isLoading}
          error={error}
        />

        {/* Action Buttons (Bottom) */}
        {!isLoading && !error && transcript.length > 0 && (
          <div className="mt-8">
            <ActionButtons
              videoId={videoId}
              onTranslateClick={() =>
                setShowTranslationSettings(!showTranslationSettings)
              }
            />
          </div>
        )}
      </div>
    </main>
  );
}
