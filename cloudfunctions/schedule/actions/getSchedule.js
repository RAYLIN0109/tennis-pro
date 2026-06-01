/**
 * 获取排期数据
 * 如果指定日期无排期，自动生成
 */
const generateSchedule = require('./generateSchedule')

module.exports = async function getSchedule(db, event) {
  const { resourceId, resourceType, date } = event

  if (!resourceId || !resourceType || !date) {
    return { code: 9002, message: '缺少必要参数' }
  }

  const schedulesCol = db.collection('schedules')
  const { data } = await schedulesCol
    .where({
      resource_id: resourceId,
      resource_type: resourceType,
      date: date
    })
    .limit(1)
    .get()

  if (data.length > 0) {
    return { code: 0, data: data[0] }
  }

  // 自动生成排期
  const result = await generateSchedule(db, event)
  if (result.code !== 0) {
    return result
  }

  // 重新查询
  const { data: newData } = await schedulesCol
    .where({
      resource_id: resourceId,
      resource_type: resourceType,
      date: date
    })
    .limit(1)
    .get()

  return { code: 0, data: newData[0] || { slots: [] } }
}
