import React from 'react';

export default function AppleEmoji({ emoji, className = "" }) {
    // Using Elk.sh CDN which specifically serves Apple style emojis
    const src = `https://emojicdn.elk.sh/${encodeURIComponent(emoji)}?style=apple`;

    return (
        <img
            src={src}
            alt={emoji}
            className={`inline-block h-[1.2em] w-[1.2em] align-middle -mt-1 ${className}`}
            loading="lazy"
            decoding="async"
            aria-hidden="true"
        />
    );
}
