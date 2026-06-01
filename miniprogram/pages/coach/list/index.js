const CoachService = require('../../services/coach')
const { priceShort } = require('../../utils/formatter')
var mock = require('../../common/mock-data')

Page({
  data: {
    list: [],
    page: 1,
    pageSize: 10,
    total: 0,
    loading: false,
    hasMore: true,
    searchValue: '',
    sortBy: 'rating',
    sortOptions: [
      { value: 'rating', label: '评分最高' },
      { value: 'price_asc', label: '价格最低' },
      { value: 'price_desc', label: '价格最高' },
      { value: 'experience', label: '经验最丰富' }
    ],
    showSortPanel: false
  },

  onLoad() {
    this.loadData(true)
  },

  onPullDownRefresh() {
    this.loadData(true).then(() => wx.stopPullDownRefresh())
  },

  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) {
      this.loadData(false)
    }
  },

  loadData(reset) {
    if (this.data.loading) return Promise.resolve()

    const page = reset ? 1 : this.data.page
    this.setData({ loading: true })

    if (reset) {
      this.setData({ list: [], hasMore: true })
    }

    const params = {
      page,
      pageSize: this.data.pageSize,
      sortBy: this.data.sortBy
    }

    const serviceCall = this.data.searchValue
      ? CoachService.search(this.data.searchValue, page)
      : CoachService.getList(params)

    return serviceCall
      .then((res) => {
        var list = res.list.map(function(c) {
          return Object.assign({}, c, { ratingText: c.rating > 0 ? String(c.rating) : '' })
        })
        const newList = reset ? list : [...this.data.list, ...list]
        this.setData({
          list: newList,
          total: res.total,
          page: page + 1,
          hasMore: newList.length < res.total
        })
      })
      .catch(() => {
        if (reset) {
          var mockList = mock.mockCoaches
          if (this.data.searchValue) {
            var kw = this.data.searchValue.toLowerCase()
            mockList = mockList.filter(function(c) {
              return c.real_name.toLowerCase().indexOf(kw) > -1 ||
                c.specialties.join(',').toLowerCase().indexOf(kw) > -1
            })
          }
          this.setData({ list: mockList, total: mockList.length, hasMore: false })
        }
      })
      .finally(() => {
        this.setData({ loading: false })
      })
  },

  onSearch(e) {
    this.setData({ searchValue: e.detail.value || '' })
    this.loadData(true)
  },

  onSearchChange(e) {
    this.setData({ searchValue: e.detail.value })
  },

  toggleSortPanel() {
    this.setData({ showSortPanel: !this.data.showSortPanel })
  },

  onSortChange(e) {
    const sortBy = e.currentTarget.dataset.value
    this.setData({ sortBy, showSortPanel: false })
    this.loadData(true)
  },

  goCoachDetail(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: `/pages/coach/detail/index?id=${id}` })
  }
})
