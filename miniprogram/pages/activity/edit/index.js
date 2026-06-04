Page({
  data: {
    activityId: '',
    activityTypes: [
      { value: 'pickup_game', label: '约球', icon: '🎾' },
      { value: 'watch_party', label: '观赛', icon: '📺' },
      { value: 'training', label: '训练营', icon: '🏋️' },
      { value: 'tournament', label: '比赛', icon: '🏆' }
    ],
    availableTags: ['新手友好', '进阶提升', '周末活动', '室内场', '室外场', '单打', '双打'],
    tagItems: [
      { name: '新手友好', selected: false },
      { name: '进阶提升', selected: false },
      { name: '周末活动', selected: false },
      { name: '室内场', selected: false },
      { name: '室外场', selected: false },
      { name: '单打', selected: false },
      { name: '双打', selected: false }
    ],
    form: {
      type: 'pickup_game',
      title: '',
      description: '',
      start_time: '',
      end_time: '',
      location_name: '',
      location: null,
      min_participants: 2,
      max_participants: 10,
      fee: '',
      tags: [],
      cover_image: ''
    },
    hasParticipants: false,
    todayDate: '',
    maxDate: '',
    startDate: '',
    startTime: '',
    startDateText: '',
    startTimeText: '',
    endDate: '',
    endTime: '',
    endDateText: '',
    endTimeText: '',
    canSubmit: true,
    loading: true
  },

  onLoad(options) {
    const { id } = options
    if (!id) {
      wx.showToast({ title: '缺少活动ID', icon: 'none' })
      setTimeout(() => wx.navigateBack(), 1000)
      return
    }

    // 初始化日期范围
    const now = new Date()
    const today = this.formatISODate(now)
    const max = new Date(now)
    max.setDate(max.getDate() + 30)
    const maxDate = this.formatISODate(max)

    this.setData({
      activityId: id,
      todayDate: today,
      maxDate: maxDate
    })

    this.loadActivity(id)
  },

  async loadActivity(id) {
    try {
      const ActivityService = require('../../../services/activity')
      const res = await ActivityService.getDetail(id)
      const activity = res.data
      const participants = activity.participants || []
      const hasParticipants = participants.length > 0

      // Parse the existing time
      const startTime = new Date(activity.start_time)
      const endTime = new Date(activity.end_time)

      const startDateStr = this.formatISODate(startTime)
      const endDateStr = this.formatISODate(endTime)
      const startTimeStr = `${String(startTime.getHours()).padStart(2, '0')}:${String(startTime.getMinutes()).padStart(2, '0')}`
      const endTimeStr = `${String(endTime.getHours()).padStart(2, '0')}:${String(endTime.getMinutes()).padStart(2, '0')}`

      // Determine which tags are selected
      const activityTags = activity.tags || []
      const tagItems = this.data.tagItems.map(item => ({
        ...item,
        selected: activityTags.includes(item.name)
      }))

      this.setData({
        form: {
          type: activity.type,
          title: activity.title,
          description: activity.description || '',
          start_time: activity.start_time,
          end_time: activity.end_time,
          location_name: (activity.location && activity.location.name) || '',
          location: activity.location || null,
          min_participants: activity.min_participants,
          max_participants: activity.max_participants,
          fee: activity.fee_type === 'free' ? '' : ((activity.fee || 0) / 100).toString(),
          tags: activityTags,
          cover_image: activity.cover_image || ''
        },
        startDate: startDateStr,
        startTime: startTimeStr,
        startDateText: this.formatDateText(startTime),
        startTimeText: startTimeStr,
        endDate: endDateStr,
        endTime: endTimeStr,
        endDateText: this.formatDateText(endTime),
        endTimeText: endTimeStr,
        tagItems: tagItems,
        hasParticipants: hasParticipants,
        loading: false
      }, () => {
        // Sync form time fields (already ISO from DB, but ensure sync for submit)
        this.syncTimeFields()
      })

    } catch (err) {
      console.error('加载活动失败:', err)
      wx.showToast({ title: '加载活动失败', icon: 'none' })
      setTimeout(() => wx.navigateBack(), 1500)
    }
  },

  /* ===== Time helpers ===== */

  formatISODate(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
  },

  formatDateText(date) {
    const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
    return `${date.getMonth() + 1}月${date.getDate()}日 ${weekDays[date.getDay()]}`
  },

  /**
   * Sync form.start_time and form.end_time as ISO strings from picker values
   */
  syncTimeFields() {
    const { startDate, startTime, endDate, endTime } = this.data
    if (startDate && startTime) {
      const iso = new Date(`${startDate}T${startTime}:00`).toISOString()
      this.setData({ 'form.start_time': iso })
    }
    if (endDate && endTime) {
      const iso = new Date(`${endDate}T${endTime}:00`).toISOString()
      this.setData({ 'form.end_time': iso })
    }
  },

  /**
   * Format ISO date string to user-friendly display (e.g., "6月3日 19:00")
   */
  formatTimeDisplay(isoStr) {
    if (!isoStr) return ''
    try {
      const d = new Date(isoStr)
      const month = d.getMonth() + 1
      const day = d.getDate()
      const hour = String(d.getHours()).padStart(2, '0')
      const min = String(d.getMinutes()).padStart(2, '0')
      return `${month}月${day}日 ${hour}:${min}`
    } catch (e) {
      return isoStr
    }
  },

  goBack() {
    wx.navigateBack()
  },

  selectType(e) {
    // Can't change type if others have joined
    if (this.data.hasParticipants) return
    const type = e.currentTarget.dataset.value
    this.setData({ 'form.type': type })
  },

  onTitleInput(e) {
    this.setData({ 'form.title': e.detail.value })
  },

  onDescInput(e) {
    this.setData({ 'form.description': e.detail.value })
  },

  onLocationInput(e) {
    if (this.data.hasParticipants) return
    this.setData({ 'form.location_name': e.detail.value })
  },

  onFeeInput(e) {
    this.setData({ 'form.fee': e.detail.value })
  },

  toggleFree() {
    const currentFee = this.data.form.fee
    this.setData({ 'form.fee': currentFee === '' || parseFloat(currentFee) === 0 ? '50' : '' })
  },

  onStartDateChange(e) {
    if (this.data.hasParticipants) return
    const dateStr = e.detail.value
    const date = new Date(dateStr)
    const dateText = this.formatDateText(date)
    this.setData({
      startDate: dateStr,
      startDateText: dateText,
      endDate: dateStr,
      endDateText: dateText
    }, () => {
      this.syncTimeFields()
    })
  },

  onStartTimeChange(e) {
    if (this.data.hasParticipants) return
    this.setData({
      startTime: e.detail.value,
      startTimeText: e.detail.value
    }, () => {
      this.syncTimeFields()
    })
  },

  onEndDateChange(e) {
    if (this.data.hasParticipants) return
    const dateStr = e.detail.value
    const date = new Date(dateStr)
    const dateText = this.formatDateText(date)
    this.setData({
      endDate: dateStr,
      endDateText: dateText
    }, () => {
      this.syncTimeFields()
    })
  },

  onEndTimeChange(e) {
    if (this.data.hasParticipants) return
    this.setData({
      endTime: e.detail.value,
      endTimeText: e.detail.value
    }, () => {
      this.syncTimeFields()
    })
  },

  chooseLocation() {
    if (this.data.hasParticipants) {
      wx.showToast({ title: '已有球友报名，地点不可修改', icon: 'none' })
      return
    }
    wx.chooseLocation({
      success: (res) => {
        this.setData({
          'form.location_name': res.name,
          'form.location': {
            name: res.name,
            address: res.address,
            lat: res.latitude,
            lng: res.longitude
          }
        })
      },
      fail: () => {
        wx.showToast({ title: '请手动输入地址', icon: 'none' })
      }
    })
  },

  increaseMin() {
    if (this.data.hasParticipants) return
    const { min_participants, max_participants } = this.data.form
    if (min_participants < max_participants - 1) {
      this.setData({ 'form.min_participants': min_participants + 1 })
    }
  },

  decreaseMin() {
    if (this.data.hasParticipants) return
    const { min_participants } = this.data.form
    if (min_participants > 1) {
      this.setData({ 'form.min_participants': min_participants - 1 })
    }
  },

  increaseMax() {
    if (this.data.hasParticipants) return
    const { max_participants } = this.data.form
    if (max_participants < 100) {
      this.setData({ 'form.max_participants': max_participants + 1 })
    }
  },

  decreaseMax() {
    if (this.data.hasParticipants) return
    const { min_participants, max_participants } = this.data.form
    if (max_participants > min_participants + 1) {
      this.setData({ 'form.max_participants': max_participants - 1 })
    }
  },

  toggleTag(e) {
    const tagName = e.currentTarget.dataset.tag
    const tagItems = this.data.tagItems.map(item => {
      if (item.name === tagName) {
        return { ...item, selected: !item.selected }
      }
      return item
    })
    const tags = tagItems.filter(item => item.selected).map(item => item.name)
    this.setData({
      tagItems,
      'form.tags': tags
    })
  },

  async submitForm() {
    const { form, activityId } = this.data

    // Validate required fields
    if (!form.title || !form.title.trim()) {
      wx.showToast({ title: '请输入活动标题', icon: 'none' })
      return
    }
    if (!this.data.hasParticipants) {
      if (!form.start_time) {
        wx.showToast({ title: '请选择开始时间', icon: 'none' })
        return
      }
      if (!form.end_time) {
        wx.showToast({ title: '请选择结束时间', icon: 'none' })
        return
      }
      if (!form.location_name && !form.location) {
        wx.showToast({ title: '请选择活动地点', icon: 'none' })
        return
      }
    }

    // Only include changed fields
    const updateData = {
      title: form.title,
      description: form.description,
      tags: form.tags,
      fee: parseFloat(form.fee) || 0,
      fee_type: parseFloat(form.fee) > 0 ? 'paid' : 'free',
      cover_image: form.cover_image
    }

    // These can only be changed if no one else has joined
    if (!this.data.hasParticipants) {
      updateData.type = form.type
      updateData.start_time = form.start_time
      updateData.end_time = form.end_time
      updateData.location = form.location || { name: form.location_name }
      updateData.min_participants = form.min_participants
      updateData.max_participants = form.max_participants
    }

    // Validate end time after start time
    if (updateData.start_time && updateData.end_time &&
        new Date(updateData.end_time) <= new Date(updateData.start_time)) {
      wx.showToast({ title: '结束时间必须晚于开始时间', icon: 'none' })
      return
    }

    try {
      const ActivityService = require('../../../services/activity')
      await ActivityService.edit(activityId, updateData)
      wx.showToast({ title: '保存成功', icon: 'success' })
      setTimeout(() => {
        wx.navigateBack()
      }, 1500)
    } catch (err) {
      wx.showToast({ title: err.message || '保存失败', icon: 'none' })
    }
  },


})