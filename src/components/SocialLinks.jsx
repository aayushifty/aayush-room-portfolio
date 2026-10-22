import React from 'react';
import { SocialIcon } from 'react-social-icons';
import { socialLinks } from '../data/social';

export default function SocialLinks() {
  return (
    <div className="social-media-parent" aria-label="Social Links">
      <SocialIcon
        className="social-icon"
        url={socialLinks.github}
        style={{ height: 46, width: 46 }}
        target="_blank"
        bgColor="rgba(255, 255, 255, 0.1)"
        fgColor="#00f5d4"
      />
      <SocialIcon
        className="social-icon"
        url={socialLinks.tiktok}
        style={{ height: 46, width: 46 }}
        target="_blank"
        bgColor="rgba(255, 255, 255, 0.1)"
        fgColor="#00f5d4"
      />
      <SocialIcon
        className="social-icon"
        url={socialLinks.instagram}
        style={{ height: 46, width: 46 }}
        target="_blank"
        bgColor="rgba(255, 255, 255, 0.1)"
        fgColor="#00f5d4"
      />
      <SocialIcon
        className="social-icon"
        url={socialLinks.mail}
        style={{ height: 46, width: 46 }}
        bgColor="rgba(255, 255, 255, 0.1)"
        fgColor="#00b4d8"
      />
    </div>
  );
}
