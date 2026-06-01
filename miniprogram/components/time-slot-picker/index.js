const { priceShort } = require('../../utils/formatter')

Component({
  options: { multipleSlots: true },
  externalClasses: ['custom-class'],
  properties: {
    slots: { type: Array, value: [] },
    multi: { type: Boolean, value: false },
    disabled: { type: Boolean, value: false },
    showPrice: { type: Boolean, value: false }
  },
  data: {
    selectedIndexes: [],
    processedSlots: []
  },
  observers: {
    'slots': function (slots) {
      var processed = slots.map(function(s) {
        return Object.assign({}, s, {
          displayPrice: s.price ? (s.price / 100) : ''
        })
      })
      this.setData({ processedSlots: processed, selectedIndexes: [] })
    }
  },
  methods: {
    onTapSlot(e) {
      if (this.data.disabled) return
      const idx = e.currentTarget.dataset.index
      const slot = this.data.slots[idx]
      if (!slot || slot.status !== 'available') return

      let selected = [...this.data.selectedIndexes]

      if (this.data.multi) {
        const pos = selected.indexOf(idx)
        if (pos > -1) {
          selected.splice(pos, 1)
        } else {
          selected.push(idx)
        }
      } else {
        selected = selected.includes(idx) ? [] : [idx]
      }

      // Sort selected indexes for display
      selected.sort((a, b) => a - b)
      this.setData({ selectedIndexes: selected })

      const selectedSlots = selected.map((i) => this.data.slots[i])
      this.triggerEvent('change', { indexes: selected, slots: selectedSlots })
    },

    getSlotClass(idx) {
      const slot = this.data.slots[idx]
      if (!slot) return ''
      const classes = ['slot']
      if (slot.status === 'booked' || slot.status === 'blocked') {
        classes.push('slot-disabled')
      } else if (slot.status === 'pending') {
        classes.push('slot-pending')
      } else if (this.data.selectedIndexes.includes(idx)) {
        classes.push('slot-selected')
      } else {
        classes.push('slot-available')
      }
      return classes.join(' ')
    }
  }
})
