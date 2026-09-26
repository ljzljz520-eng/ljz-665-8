-- ============================================================================
-- 仓库叉车档案：建表 + 低代码平台菜单 + 字典 初始化脚本（MySQL）
-- 使用前：将 @parentMenuId 替换为平台中"仓储管理"目录的实际 menu_id
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. 业务表：wms_forklift（仓库叉车档案表）
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS wms_forklift (
  forklift_id             BIGINT       NOT NULL AUTO_INCREMENT COMMENT '叉车ID',
  forklift_no             VARCHAR(30)  NOT NULL                COMMENT '叉车编号',
  model                   VARCHAR(50)  NOT NULL                COMMENT '型号',
  warehouse_zone          VARCHAR(10)  NOT NULL                COMMENT '仓区（字典 warehouse_zone）',
  driver_name             VARCHAR(30)  NOT NULL                COMMENT '司机',
  annual_inspection_date  DATE         DEFAULT NULL            COMMENT '年检日期',
  maintenance_status      CHAR(1)      DEFAULT '0'             COMMENT '维修状态（0正常 1维修中 2停用，字典 forklift_maintenance_status）',
  remark                  VARCHAR(200) DEFAULT NULL            COMMENT '备注',
  create_by               VARCHAR(64)  DEFAULT ''              COMMENT '创建者',
  create_time             DATETIME     DEFAULT NULL            COMMENT '创建时间',
  update_by               VARCHAR(64)  DEFAULT ''              COMMENT '更新者',
  update_time             DATETIME     DEFAULT NULL            COMMENT '更新时间',
  PRIMARY KEY (forklift_id),
  UNIQUE KEY uk_forklift_no (forklift_no)
) ENGINE = InnoDB COMMENT = '仓库叉车档案表';

-- ---------------------------------------------------------------------------
-- 2. 低代码平台菜单：挂到"仓储管理"目录下
-- ---------------------------------------------------------------------------
SET @parentMenuId = 2000; -- TODO: 按平台实际目录 menu_id 调整

INSERT INTO sys_menu (menu_name, parent_id, order_num, path, component, query, is_frame, is_cache, menu_type, visible, status, perms, icon, create_by, create_time, remark)
VALUES ('叉车档案', @parentMenuId, 1, 'forklift', 'warehouse/forklift/index', '', 0, 0, 'C', '0', '0', 'warehouse:forklift:list', 'form', 'admin', NOW(), '仓库叉车档案菜单');
SET @forkliftMenuId = LAST_INSERT_ID();

-- 按钮权限
INSERT INTO sys_menu (menu_name, parent_id, order_num, path, component, query, is_frame, is_cache, menu_type, visible, status, perms, icon, create_by, create_time, remark) VALUES
('叉车查询', @forkliftMenuId, 1, '', '', '', 0, 0, 'F', '0', '0', 'warehouse:forklift:query',  '#', 'admin', NOW(), ''),
('叉车新增', @forkliftMenuId, 2, '', '', '', 0, 0, 'F', '0', '0', 'warehouse:forklift:add',    '#', 'admin', NOW(), ''),
('叉车修改', @forkliftMenuId, 3, '', '', '', 0, 0, 'F', '0', '0', 'warehouse:forklift:edit',   '#', 'admin', NOW(), ''),
('叉车删除', @forkliftMenuId, 4, '', '', '', 0, 0, 'F', '0', '0', 'warehouse:forklift:remove', '#', 'admin', NOW(), ''),
('叉车导出', @forkliftMenuId, 5, '', '', '', 0, 0, 'F', '0', '0', 'warehouse:forklift:export', '#', 'admin', NOW(), '');

-- ---------------------------------------------------------------------------
-- 3. 字典：仓区 warehouse_zone
-- ---------------------------------------------------------------------------
INSERT INTO sys_dict_type (dict_name, dict_type, status, create_by, create_time, remark)
VALUES ('仓区', 'warehouse_zone', '0', 'admin', NOW(), '仓库仓区字典');

INSERT INTO sys_dict_data (dict_sort, dict_label, dict_value, dict_type, css_class, list_class, is_default, status, create_by, create_time, remark) VALUES
(1, 'A区', 'A', 'warehouse_zone', '', '', 'N', '0', 'admin', NOW(), ''),
(2, 'B区', 'B', 'warehouse_zone', '', '', 'N', '0', 'admin', NOW(), ''),
(3, 'C区', 'C', 'warehouse_zone', '', '', 'N', '0', 'admin', NOW(), ''),
(4, 'D区', 'D', 'warehouse_zone', '', '', 'N', '0', 'admin', NOW(), '');

-- ---------------------------------------------------------------------------
-- 4. 字典：叉车维修状态 forklift_maintenance_status
-- ---------------------------------------------------------------------------
INSERT INTO sys_dict_type (dict_name, dict_type, status, create_by, create_time, remark)
VALUES ('叉车维修状态', 'forklift_maintenance_status', '0', 'admin', NOW(), '叉车维修状态字典');

INSERT INTO sys_dict_data (dict_sort, dict_label, dict_value, dict_type, css_class, list_class, is_default, status, create_by, create_time, remark) VALUES
(1, '正常',   '0', 'forklift_maintenance_status', '', 'success', 'Y', '0', 'admin', NOW(), ''),
(2, '维修中', '1', 'forklift_maintenance_status', '', 'warning', 'N', '0', 'admin', NOW(), ''),
(3, '停用',   '2', 'forklift_maintenance_status', '', 'danger',  'N', '0', 'admin', NOW(), '');
