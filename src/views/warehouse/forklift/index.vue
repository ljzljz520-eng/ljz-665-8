<template>
  <div class="app-container">
    <!-- 查询区域：支持按仓区筛选 -->
    <el-form v-show="showSearch" ref="queryForm" :model="queryParams" :inline="true" label-width="82px">
      <el-form-item label="叉车编号" prop="forkliftNo">
        <el-input
          v-model="queryParams.forkliftNo"
          placeholder="请输入叉车编号"
          clearable
          size="small"
          style="width: 200px"
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item label="仓区" prop="warehouseZone">
        <el-select v-model="queryParams.warehouseZone" placeholder="请选择仓区" clearable size="small" style="width: 160px">
          <el-option
            v-for="dict in dict.type.warehouse_zone"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="维修状态" prop="maintenanceStatus">
        <el-select v-model="queryParams.maintenanceStatus" placeholder="请选择维修状态" clearable size="small" style="width: 160px">
          <el-option
            v-for="dict in dict.type.forklift_maintenance_status"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="el-icon-search" size="mini" @click="handleQuery">搜索</el-button>
        <el-button icon="el-icon-refresh" size="mini" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <!-- 操作按钮区 -->
    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button
          type="primary"
          plain
          icon="el-icon-plus"
          size="mini"
          @click="handleAdd"
          v-hasPermi="['warehouse:forklift:add']"
        >新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="success"
          plain
          icon="el-icon-edit"
          size="mini"
          :disabled="single"
          @click="handleUpdate"
          v-hasPermi="['warehouse:forklift:edit']"
        >修改</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="danger"
          plain
          icon="el-icon-delete"
          size="mini"
          :disabled="multiple"
          @click="handleDelete"
          v-hasPermi="['warehouse:forklift:remove']"
        >删除</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="warning"
          plain
          icon="el-icon-download"
          size="mini"
          @click="handleExport"
          v-hasPermi="['warehouse:forklift:export']"
        >导出</el-button>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <!-- 数据表格 -->
    <el-table v-loading="loading" :data="forkliftList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="叉车编号" align="center" prop="forkliftNo" width="110" />
      <el-table-column label="型号" align="center" prop="model" />
      <el-table-column label="仓区" align="center" prop="warehouseZone">
        <template slot-scope="scope">
          <dict-tag :options="dict.type.warehouse_zone" :value="scope.row.warehouseZone" />
        </template>
      </el-table-column>
      <el-table-column label="司机" align="center" prop="driverName" />
      <el-table-column label="年检日期" align="center" prop="annualInspectionDate" width="110" />
      <el-table-column label="维修状态" align="center" prop="maintenanceStatus">
        <template slot-scope="scope">
          <dict-tag :options="dict.type.forklift_maintenance_status" :value="scope.row.maintenanceStatus" />
        </template>
      </el-table-column>
      <el-table-column label="备注" align="center" prop="remark" :show-overflow-tooltip="true" />
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width" width="150">
        <template slot-scope="scope">
          <el-button
            size="mini"
            type="text"
            icon="el-icon-edit"
            @click="handleUpdate(scope.row)"
            v-hasPermi="['warehouse:forklift:edit']"
          >修改</el-button>
          <el-button
            size="mini"
            type="text"
            icon="el-icon-delete"
            @click="handleDelete(scope.row)"
            v-hasPermi="['warehouse:forklift:remove']"
          >删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <pagination
      v-show="total > 0"
      :total="total"
      :page.sync="queryParams.pageNum"
      :limit.sync="queryParams.pageSize"
      @pagination="getList"
    />

    <!-- 新增/修改叉车档案对话框 -->
    <el-dialog :title="title" :visible.sync="open" width="560px" append-to-body>
      <el-form ref="form" :model="form" :rules="rules" label-width="90px">
        <el-form-item label="叉车编号" prop="forkliftNo">
          <el-input v-model="form.forkliftNo" placeholder="请输入叉车编号" maxlength="30" />
        </el-form-item>
        <el-form-item label="型号" prop="model">
          <el-input v-model="form.model" placeholder="请输入型号" maxlength="50" />
        </el-form-item>
        <el-form-item label="仓区" prop="warehouseZone">
          <el-select v-model="form.warehouseZone" placeholder="请选择仓区" style="width: 100%">
            <el-option
              v-for="dict in dict.type.warehouse_zone"
              :key="dict.value"
              :label="dict.label"
              :value="dict.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="司机" prop="driverName">
          <el-input v-model="form.driverName" placeholder="请输入司机姓名" maxlength="30" />
        </el-form-item>
        <el-form-item label="年检日期" prop="annualInspectionDate">
          <el-date-picker
            v-model="form.annualInspectionDate"
            type="date"
            value-format="yyyy-MM-dd"
            placeholder="请选择年检日期"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="维修状态" prop="maintenanceStatus">
          <el-radio-group v-model="form.maintenanceStatus">
            <el-radio
              v-for="dict in dict.type.forklift_maintenance_status"
              :key="dict.value"
              :label="dict.value"
            >{{ dict.label }}</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="form.remark" type="textarea" :rows="3" placeholder="请输入备注" maxlength="200" />
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button type="primary" @click="submitForm">确 定</el-button>
        <el-button @click="cancel">取 消</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { listForklift, getForklift, addForklift, updateForklift, delForklift } from '@/api/warehouse/forklift'

export default {
  name: 'WarehouseForklift',
  dicts: ['warehouse_zone', 'forklift_maintenance_status'],
  data() {
    return {
      // 遮罩层
      loading: true,
      // 选中数组
      ids: [],
      // 非单个禁用
      single: true,
      // 非多个禁用
      multiple: true,
      // 显示搜索条件
      showSearch: true,
      // 总条数
      total: 0,
      // 叉车档案表格数据
      forkliftList: [],
      // 弹出层标题
      title: '',
      // 是否显示弹出层
      open: false,
      // 查询参数（仓区筛选条件在此维护）
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        forkliftNo: undefined,
        warehouseZone: undefined,
        maintenanceStatus: undefined
      },
      // 表单参数
      form: {},
      // 表单校验
      rules: {
        forkliftNo: [{ required: true, message: '叉车编号不能为空', trigger: 'blur' }],
        model: [{ required: true, message: '型号不能为空', trigger: 'blur' }],
        warehouseZone: [{ required: true, message: '仓区不能为空', trigger: 'change' }],
        driverName: [{ required: true, message: '司机不能为空', trigger: 'blur' }],
        annualInspectionDate: [{ required: true, message: '年检日期不能为空', trigger: 'change' }],
        maintenanceStatus: [{ required: true, message: '维修状态不能为空', trigger: 'change' }]
      }
    }
  },
  created() {
    this.getList()
  },
  methods: {
    /** 查询叉车档案列表 */
    getList() {
      this.loading = true
      listForklift(this.queryParams).then(response => {
        this.forkliftList = response.rows
        this.total = response.total
        this.loading = false
      })
    },
    /** 取消按钮 */
    cancel() {
      this.open = false
      this.reset()
    },
    /** 表单重置 */
    reset() {
      this.form = {
        forkliftId: undefined,
        forkliftNo: undefined,
        model: undefined,
        warehouseZone: undefined,
        driverName: undefined,
        annualInspectionDate: undefined,
        maintenanceStatus: '0',
        remark: undefined
      }
      this.resetForm('form')
    },
    /** 搜索按钮操作 */
    handleQuery() {
      this.queryParams.pageNum = 1
      this.getList()
    },
    /** 重置按钮操作 */
    resetQuery() {
      this.resetForm('queryForm')
      this.handleQuery()
    },
    /** 多选框选中数据 */
    handleSelectionChange(selection) {
      this.ids = selection.map(item => item.forkliftId)
      this.single = selection.length !== 1
      this.multiple = !selection.length
    },
    /** 新增按钮操作 */
    handleAdd() {
      this.reset()
      this.open = true
      this.title = '添加叉车档案'
    },
    /** 修改按钮操作 */
    handleUpdate(row) {
      this.reset()
      const forkliftId = row.forkliftId || this.ids
      getForklift(forkliftId).then(response => {
        this.form = response.data
        this.open = true
        this.title = '修改叉车档案'
      })
    },
    /** 提交按钮 */
    submitForm() {
      this.$refs['form'].validate(valid => {
        if (!valid) {
          return
        }
        if (this.form.forkliftId !== undefined) {
          updateForklift(this.form).then(() => {
            this.$modal.msgSuccess('修改成功')
            this.open = false
            this.getList()
          })
        } else {
          addForklift(this.form).then(() => {
            this.$modal.msgSuccess('新增成功')
            this.open = false
            this.getList()
          })
        }
      })
    },
    /** 删除按钮操作 */
    handleDelete(row) {
      const forkliftIds = row.forkliftId || this.ids
      this.$modal.confirm('是否确认删除选中的叉车档案数据项？').then(() => {
        return delForklift(forkliftIds)
      }).then(() => {
        this.getList()
        this.$modal.msgSuccess('删除成功')
      }).catch(() => {})
    },
    /** 导出按钮操作：只导出当前查询条件下的结果（携带 queryParams） */
    handleExport() {
      this.download('warehouse/forklift/export', {
        ...this.queryParams
      }, `forklift_${new Date().getTime()}.xlsx`)
    }
  }
}
</script>
