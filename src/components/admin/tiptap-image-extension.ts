import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import { ImageNodeView } from './tiptap-image-node-view'

export const CustomImageNode = Node.create({
  name: 'image',

  group: 'inline',

  inline: true,

  draggable: true,

  addAttributes() {
    return {
      src: {
        default: null,
      },
      alt: {
        default: null,
      },
      title: {
        default: null,
      },
      style: {
        default: 'width: 75%; height: auto; display: block; margin: 12px auto;',
      },
      class: {
        default: null,
      },
      "data-layout": {
        default: "center",
      }
    }
  },

  parseHTML() {
    return [
      {
        tag: 'img[src]',
        getAttrs: (dom) => {
          if (typeof dom === 'string') return {}
          const element = dom as HTMLElement
          return {
            src: element.getAttribute('src'),
            alt: element.getAttribute('alt'),
            title: element.getAttribute('title'),
            style: element.getAttribute('style') || 'width: 75%; height: auto; display: block; margin: 12px auto;',
            class: element.getAttribute('class'),
            "data-layout": element.getAttribute('data-layout') || 'center',
          }
        },
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ['img', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes)]
  },

  addNodeView() {
    return ReactNodeViewRenderer(ImageNodeView)
  },
})
