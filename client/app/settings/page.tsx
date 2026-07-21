import React from 'react'
import type { Metadata } from "next";
import { SettingsContent } from './SettingsContent'

export const metadata: Metadata = {
  title: "Data Privacy Settings – EchoMind",
  description: "Manage your personal data, toggle personalized AI memory, and exercise your right to erasure under the DPDP Act.",
};

export default function Settings() {
  return (
    <SettingsContent />
  )
}
