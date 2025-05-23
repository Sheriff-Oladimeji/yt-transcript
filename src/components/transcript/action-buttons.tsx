"use client";

import { useState, useEffect, useRef } from "react";
import { useTranscriptStore } from "@/store/transcript-store";
import { useTranslationStore } from "@/store/translation-store";
import {
  Brain,
  Copy,
  ExternalLink,
  Languages,
  Download,
  FileText,
  FileType,
} from "lucide-react";
import { toast } from "sonner";
import {
  formatTranscriptForDownload,
  generateUniqueId,
  downloadTextFile,
} from "@/lib/export";
import BookmarkPopup from "./bookmark-popup";
import { useT } from "@/i18n/client";

interface ActionButtonsProps {
  onTranslateClick: () => void;
  isBottomButton?: boolean;
}

export default function ActionButtons({
  onTranslateClick,
  isBottomButton = false,
}: ActionButtonsProps) {
  const { transcript, videoTitle } = useTranscriptStore();
  const [showFormatOptions, setShowFormatOptions] = useState(false);
  const [showBookmarkPopup, setShowBookmarkPopup] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { t } = useT();

  // Handle click outside and keyboard events to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowFormatOptions(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setShowFormatOptions(false);
      }
    }

    // Add event listeners when dropdown is open
    if (showFormatOptions) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }

    // Clean up
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [showFormatOptions]);

  // This effect was previously used to check if user is on desktop
  // We're now handling device detection in the BookmarkPopup component

  const handleCopyTranscript = () => {
    const { translatedTranscript, currentLanguage, originalLanguage } =
      useTranslationStore.getState();
    const source =
      translatedTranscript.length > 0 && currentLanguage !== originalLanguage
        ? translatedTranscript
        : transcript;
    const text = source.map((item) => item.text).join(" ");
    navigator.clipboard
      .writeText(text)
      .then(() => {
        toast.success(t("transcript.actionButtons.copySuccess"));

        // Show bookmark popup after 2 seconds for all devices
        // The popup will show different content based on device size
        setTimeout(() => {
          setShowBookmarkPopup(true);
        }, 2000);
      })
      .catch((err) => {
        console.error("Failed to copy transcript:", err);
        toast.error(t("transcript.actionButtons.copyError"));
      });
  };

  const handleSummarize = () => {
    const { translatedTranscript, currentLanguage, originalLanguage } =
      useTranslationStore.getState();
    const source =
      translatedTranscript.length > 0 && currentLanguage !== originalLanguage
        ? translatedTranscript
        : transcript;
    const transcriptText = source.map((item) => item.text).join(" ");

    // Create the prompt for ChatGPT
    const promptText = `Summarize this youtube video transcript in detailed step by step points:`;

    try {
      // Also copy to clipboard as a fallback
      navigator.clipboard
        .writeText(`${promptText}\n\n${transcriptText}`)
        .catch((err) => {
          console.error(
            "Clipboard write failed, but continuing with ChatGPT open:",
            err
          );
        });

      // Detect platform specifically
      const ua = navigator.userAgent;
      const isAndroid = /Android/i.test(ua);
      const isIOS = /iPhone|iPad|iPod/i.test(ua);

      // Unfortunately, ChatGPT doesn't support direct URL parameters for pre-filling the input
      // So we'll just open ChatGPT and rely on the clipboard for pasting
      const chatGptUrl = `https://chat.openai.com/`;

      // Show toast message first
      toast.success(
        t("transcript.actionButtons.summarizeSuccess"),
        { duration: 5000 } // Show toast for 5 seconds
      );

      // Add a delay before opening ChatGPT to ensure users see the toast message
      setTimeout(() => {
        // Use universal link on mobile to open native app if supported
        if (isAndroid || isIOS) {
          window.location.href = chatGptUrl;
        } else {
          // Desktop/web fallback
          window.open(chatGptUrl, "_blank");
        }
      }, 3000); // 3-second delay
    } catch (err) {
      console.error("Failed to process transcript for summarization:", err);
      toast.error(t("transcript.actionButtons.summarizeError"));

      // Fallback to just copying the text
      navigator.clipboard
        .writeText(`${promptText}\n\n${transcriptText}`)
        .catch(() => {
          console.error("Even clipboard fallback failed");
        });
    }
  };

  return (
    <div className="space-y-3 mb-6">
      {/* Action buttons */}
      {/* Copy Transcript Button */}
      <button
        className="w-full py-4 px-6 bg-black hover:bg-gray-800 dark:bg-[#FFD700] dark:hover:bg-[#FFCC00] dark:text-black text-white font-medium rounded-lg flex items-center justify-center gap-2 shadow-md"
        onClick={handleCopyTranscript}
        disabled={transcript.length === 0}
      >
        <Copy className="h-5 w-5 mr-2" />
        <span>{t("transcript.actionButtons.copy")}</span>
      </button>

      {/* Download Transcript Button with Format Options */}
      <div className="relative" ref={dropdownRef}>
        <button
          className="w-full py-4 px-6 bg-[#28C76F] hover:bg-[#24b566] text-white font-medium rounded-lg flex items-center justify-center gap-2 shadow-md"
          onClick={() => setShowFormatOptions(!showFormatOptions)}
          disabled={transcript.length === 0}
        >
          <Download className="h-5 w-5 mr-2" />
          <div className="flex flex-col items-center">
            <span>{t("transcript.actionButtons.download")}</span>
            <span className="text-xs font-normal mt-1">
              {t("transcript.actionButtons.format")}
            </span>
          </div>
        </button>

        {/* Format Options Dropdown */}
        {showFormatOptions && transcript.length > 0 && (
          <div className="absolute z-10 mt-2 w-full bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-2 text-sm text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">
              {t("transcript.actionButtons.selectFormat")}
            </div>
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {/* TXT Format */}
              <button
                className="w-full px-4 py-3 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                onClick={() => {
                  // Generate a unique filename
                  const filename = generateUniqueId();
                  // Use translated transcript if available
                  const {
                    translatedTranscript,
                    currentLanguage,
                    originalLanguage,
                  } = useTranslationStore.getState();
                  const source =
                    translatedTranscript.length > 0 &&
                    currentLanguage !== originalLanguage
                      ? translatedTranscript
                      : transcript;
                  // Format the transcript content
                  const content = formatTranscriptForDownload(
                    source,
                    videoTitle
                  );
                  // Download the file
                  downloadTextFile(content, filename, "txt");
                  // Show success toast and close dropdown
                  toast.success(
                    `${t("transcript.actionButtons.downloadSuccess")} TXT!`
                  );
                  setShowFormatOptions(false);
                }}
              >
                <FileText className="h-4 w-4 mr-2 text-gray-500" />
                <span className="font-medium">
                  {t("transcript.actionButtons.plainText")}
                </span>
                <span className="ml-2 text-gray-500 dark:text-gray-400">
                  {t("transcript.actionButtons.simpleText")}
                </span>
              </button>

              {/* DOCX Format */}
              <button
                className="w-full px-4 py-3 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                onClick={() => {
                  const baseName = videoTitle
                    ? videoTitle
                        .replace(/[^\w\s-]/g, "")
                        .trim()
                        .replace(/\s+/g, "_")
                    : generateUniqueId();
                  const {
                    translatedTranscript,
                    currentLanguage,
                    originalLanguage,
                  } = useTranslationStore.getState();
                  const source =
                    translatedTranscript.length > 0 &&
                    currentLanguage !== originalLanguage
                      ? translatedTranscript
                      : transcript;
                  const content = formatTranscriptForDownload(
                    source,
                    videoTitle
                  );
                  downloadTextFile(content, baseName, "docx");
                  toast.success(
                    `${t("transcript.actionButtons.downloadSuccess")} DOCX!`
                  );
                  setShowFormatOptions(false);
                }}
              >
                <FileText className="h-4 w-4 mr-2 text-gray-500" />
                <span className="font-medium">
                  {t("transcript.actionButtons.wordDocument")}
                </span>
                <span className="ml-2 text-gray-500 dark:text-gray-400">
                  {t("transcript.actionButtons.editableDocument")}
                </span>
              </button>

              {/* PDF Format */}
              <button
                className="w-full px-4 py-3 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                onClick={() => {
                  // Use video title as filename (sanitize spaces and invalid chars)
                  const baseName = videoTitle
                    ? videoTitle
                        .replace(/[^\w\s-]/g, "")
                        .trim()
                        .replace(/\s+/g, "_")
                    : generateUniqueId();
                  const filename = baseName;
                  // Use translated transcript if available
                  const {
                    translatedTranscript,
                    currentLanguage,
                    originalLanguage,
                  } = useTranslationStore.getState();
                  const source =
                    translatedTranscript.length > 0 &&
                    currentLanguage !== originalLanguage
                      ? translatedTranscript
                      : transcript;
                  const content = formatTranscriptForDownload(
                    source,
                    videoTitle
                  );
                  downloadTextFile(content, filename, "pdf");
                  toast.success(
                    `${t("transcript.actionButtons.downloadSuccess")} PDF!`
                  );
                  setShowFormatOptions(false);
                }}
              >
                <FileType className="h-4 w-4 mr-2 text-gray-500" />
                <span className="font-medium">
                  {t("transcript.actionButtons.pdfDocument")}
                </span>
                <span className="ml-2 text-gray-500 dark:text-gray-400">
                  {t("transcript.actionButtons.printableDocument")}
                </span>
              </button>

              {/* SRT Format */}
              <button
                className="w-full px-4 py-3 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                onClick={() => {
                  const baseName = videoTitle
                    ? videoTitle
                        .replace(/[^\w\s-]/g, "")
                        .trim()
                        .replace(/\s+/g, "_")
                    : generateUniqueId();
                  const {
                    translatedTranscript,
                    currentLanguage,
                    originalLanguage,
                  } = useTranslationStore.getState();
                  const source =
                    translatedTranscript.length > 0 &&
                    currentLanguage !== originalLanguage
                      ? translatedTranscript
                      : transcript;
                  const content = formatTranscriptForDownload(
                    source,
                    videoTitle
                  );
                  downloadTextFile(content, baseName, "srt");
                  toast.success(
                    `${t("transcript.actionButtons.downloadSuccess")} SRT!`
                  );
                  setShowFormatOptions(false);
                }}
              >
                <FileText className="h-4 w-4 mr-2 text-gray-500" />
                <span className="font-medium">
                  {t("transcript.actionButtons.subtitleFile")}
                </span>
                <span className="ml-2 text-gray-500 dark:text-gray-400">
                  {t("transcript.actionButtons.forVideoSubtitles")}
                </span>
              </button>

              {/* CSV Format */}
              <button
                className="w-full px-4 py-3 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                onClick={() => {
                  const baseName = videoTitle
                    ? videoTitle
                        .replace(/[^\w\s-]/g, "")
                        .trim()
                        .replace(/\s+/g, "_")
                    : generateUniqueId();
                  const {
                    translatedTranscript,
                    currentLanguage,
                    originalLanguage,
                  } = useTranslationStore.getState();
                  const source =
                    translatedTranscript.length > 0 &&
                    currentLanguage !== originalLanguage
                      ? translatedTranscript
                      : transcript;
                  const content = formatTranscriptForDownload(
                    source,
                    videoTitle
                  );
                  downloadTextFile(content, baseName, "csv");
                  toast.success(
                    `${t("transcript.actionButtons.downloadSuccess")} CSV!`
                  );
                  setShowFormatOptions(false);
                }}
              >
                <FileText className="h-4 w-4 mr-2 text-gray-500" />
                <span className="font-medium">
                  {t("transcript.actionButtons.csvSpreadsheet")}
                </span>
                <span className="ml-2 text-gray-500 dark:text-gray-400">
                  {t("transcript.actionButtons.forDataAnalysis")}
                </span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Language & Translation Settings Button */}
      <button
        className="w-full py-4 px-6 bg-[#3F51B5] hover:bg-[#3849a2] text-white font-medium rounded-lg flex items-center justify-center gap-2 shadow-md"
        onClick={() => {
          if (isBottomButton) {
            // Find the position of the translation settings area (just after the top action buttons)
            const headerElement = document.querySelector(
              ".w-full.max-w-\\[800px\\].mx-auto.px-4.py-6"
            );
            if (headerElement) {
              // Calculate position to scroll to (just after the top action buttons)
              const topActionButtons =
                headerElement.querySelector(".space-y-3.mb-6");
              if (topActionButtons) {
                const rect = topActionButtons.getBoundingClientRect();
                const scrollPosition = window.scrollY + rect.top;
                // Scroll to the position where translation settings will appear
                window.scrollTo({ top: scrollPosition, behavior: "smooth" });
              } else {
                // Fallback if we can't find the exact position
                window.scrollTo({ top: 0, behavior: "smooth" });
              }
              // Short delay to ensure scroll completes before showing settings
              setTimeout(() => {
                onTranslateClick();
              }, 500);
            } else {
              // Fallback if we can't find the header element
              window.scrollTo({ top: 0, behavior: "smooth" });
              setTimeout(() => {
                onTranslateClick();
              }, 500);
            }
          } else {
            onTranslateClick();
          }
        }}
      >
        <div className="flex items-center justify-center flex-1">
          <Languages className="h-5 w-5 mr-2" />
          <span>{t("transcript.actionButtons.translate")}</span>
          <span className="ml-2 text-xs bg-white/20 px-2 py-0.5 rounded">
            {t("transcript.actionButtons.free")}
          </span>
        </div>
      </button>

      {/* Summarize Button */}
      <button
        className="w-full py-4 px-6 bg-[#10A37F] hover:bg-[#0e9271] text-white font-medium rounded-lg flex items-center gap-2 shadow-md"
        onClick={handleSummarize}
        disabled={transcript.length === 0}
      >
        <div className="flex items-center justify-center flex-1">
          <Brain className="h-5 w-5 mr-2" />
          <span>{t("transcript.actionButtons.summarize")}</span>
          <span className="ml-2 text-xs bg-white/20 px-2 py-0.5 rounded">
            {t("transcript.actionButtons.free")}
          </span>
        </div>
        <ExternalLink className="h-5 w-5" />
      </button>

      {/* Bookmark Popup - shown below buttons */}
      {showBookmarkPopup && (
        <BookmarkPopup
          isOpen={showBookmarkPopup}
          onClose={() => setShowBookmarkPopup(false)}
        />
      )}
    </div>
  );
}
