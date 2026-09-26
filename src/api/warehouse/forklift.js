import request from '@/utils/request'

// 查询叉车档案列表
export function listForklift(query) {
  return request({
    url: '/warehouse/forklift/list',
    method: 'get',
    params: query
  })
}

// 查询叉车档案详细
export function getForklift(forkliftId) {
  return request({
    url: '/warehouse/forklift/' + forkliftId,
    method: 'get'
  })
}

// 新增叉车档案
export function addForklift(data) {
  return request({
    url: '/warehouse/forklift',
    method: 'post',
    data: data
  })
}

// 修改叉车档案
export function updateForklift(data) {
  return request({
    url: '/warehouse/forklift',
    method: 'put',
    data: data
  })
}

// 删除叉车档案
export function delForklift(forkliftId) {
  return request({
    url: '/warehouse/forklift/' + forkliftId,
    method: 'delete'
  })
}
