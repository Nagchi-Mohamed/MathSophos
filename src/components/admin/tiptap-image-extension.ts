import { Node, mergeAttributes } from '@tiptap/core'

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
        default: null,
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
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ['img', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes)]
  },
})
