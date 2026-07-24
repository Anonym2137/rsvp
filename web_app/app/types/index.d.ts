import type { Component } from 'vue'

/** A book/text entry in the library */
export interface Book {
  id: string
  title: string
  author: string
  cover: string
  progress: number
  wordIndex?: number
  bookmark?: number
}

/** ORP-split word for RSVP display */
export interface FormattedWord {
  part1: string
  focus: string
  part2: string
  isIntro: boolean
}

/** Navigation tab definition */
export interface NavTab {
  value: string
  label: string
  icon: Component
  route: string
}
