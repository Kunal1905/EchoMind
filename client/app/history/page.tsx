import React from 'react'
import type { Metadata } from "next";
import HistoryContent from './HistoryContent'

export const metadata: Metadata = {
  title: "Session History – Echo Mind",
  description: "Review and reflect on your past mental wellness voice sessions and emotional insights.",
};

export default function History() {
  return (
    <HistoryContent />
  )
}