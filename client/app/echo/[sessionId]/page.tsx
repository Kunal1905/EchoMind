import React from 'react'
import type { Metadata } from "next";
import ChatContent from './ChatContent'

export const metadata: Metadata = {
  title: "Voice Reflection – Echo Mind",
  description: "Begin a new voice reflection session with your AI companion.",
};

export default function History() {
  return (
    <ChatContent />
  )
}