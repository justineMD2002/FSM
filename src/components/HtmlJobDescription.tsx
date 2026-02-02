import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

interface HtmlJobDescriptionProps {
  content: string;
  maxLines?: number;
  textClassName?: string;
  variant?: 'card' | 'details';
}

export default function HtmlJobDescription({
  content,
  maxLines = 2,
  textClassName = 'text-sm text-slate-600',
  variant = 'card'
}: HtmlJobDescriptionProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!content) return null;

  // Convert HTML to formatted text preserving structure
  const parseHtml = (html: string): string => {
    let text = html;

    // First, replace <p><br></p> with double newline (empty paragraph)
    text = text.replace(/<p[^>]*>\s*<br\s*\/?>\s*<\/p>/gi, '\n\n');

    // Replace closing p tag followed by opening p tag with line breaks
    text = text.replace(/<\/p>\s*<p[^>]*>/gi, '\n\n');

    // Replace standalone br tags with newlines
    text = text.replace(/<br\s*\/?>/gi, '\n');

    // Replace list items with bullet points
    text = text.replace(/<li[^>]*>/gi, '• ');
    text = text.replace(/<\/li>/gi, '\n');

    // Remove opening p tags
    text = text.replace(/<p[^>]*>/gi, '');

    // Replace closing p tags with newline
    text = text.replace(/<\/p>/gi, '\n');

    // Remove all other HTML tags (including span, div, strong, etc.)
    text = text.replace(/<[^>]+>/g, '');

    // Decode HTML entities
    text = text.replace(/&nbsp;/g, ' ');
    text = text.replace(/&amp;/g, '&');
    text = text.replace(/&lt;/g, '<');
    text = text.replace(/&gt;/g, '>');
    text = text.replace(/&quot;/g, '"');
    text = text.replace(/&#39;/g, "'");

    // Clean up excessive whitespace
    text = text.replace(/[ \t]+/g, ' '); // Multiple spaces/tabs to single space
    text = text.replace(/\n[ \t]+/g, '\n'); // Remove spaces after newlines
    text = text.replace(/[ \t]+\n/g, '\n'); // Remove spaces before newlines
    text = text.replace(/\n{3,}/g, '\n\n'); // Max 2 consecutive newlines

    return text.trim();
  };

  const formattedText = parseHtml(content);

  // Split into lines and check if truncation is needed
  const allLines = formattedText.split('\n').filter(line => line.trim().length > 0);
  const needsExpansion = allLines.length > maxLines;

  // Get display text - show first maxLines when collapsed
  const displayText = isExpanded
    ? formattedText
    : allLines.slice(0, maxLines).join('\n') + (needsExpansion ? '...' : '');

  return (
    <View>
      <Text
        className={textClassName}
        style={{ lineHeight: 20 }}
      >
        {displayText}
      </Text>

      {needsExpansion && (
        <TouchableOpacity
          onPress={() => setIsExpanded(!isExpanded)}
          activeOpacity={0.7}
          className="mt-1"
        >
          <Text className="text-[#0092ce] text-sm font-medium">
            {isExpanded ? 'See less' : 'See more...'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}