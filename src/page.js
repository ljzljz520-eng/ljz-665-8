/**
 * 叉车档案页 - 页面逻辑
 * 命名约定见 docs/naming.md
 */
(function () {
  'use strict';

  var api = window.ForkliftApi;
  var ElMessage = window.ElementPlus.ElMessage;

  /** 导出文件名时间戳：yyyyMMdd_HHmmss */
  function fileTimestamp() {
    var d = new Date();
    function p(n) { return ('0' + n).slice(-2); }
    return d.getFullYear() + p(d.getMonth() + 1) + p(d.getDate()) +
      '_' + p(d.getHours()) + p(d.getMinutes()) + p(d.getSeconds());
  }

  var app = Vue.createApp({
    setup: function () {
      /* 查询条件（字段名与接口查询参数一致） */
      var query = Vue.ref({ warehouseZone: '', keyword: '' });

      /* 当前查询结果（全量）。导出即导出这份数据，保证“只导当前查询结果” */
      var list = Vue.ref([]);
      var loading = Vue.ref(false);
      var pageNo = Vue.ref(1);
      var pageSize = Vue.ref(10);

      var total = Vue.computed(function () { return list.value.length; });

      /* 当前页数据（前端分页切片） */
      var pagedList = Vue.computed(function () {
        var start = (pageNo.value - 1) * pageSize.value;
        return list.value.slice(start, start + pageSize.value);
      });

      /* 当前筛选条件摘要，展示在工具栏，导出前可确认范围 */
      var filterSummary = Vue.computed(function () {
        var parts = [];
        if (query.value.warehouseZone) {
          parts.push('仓区=' + api.zoneLabel(query.value.warehouseZone));
        }
        if (query.value.keyword) {
          parts.push('关键字=' + query.value.keyword);
        }
        return parts.length ? parts.join('，') : '未筛选（全部数据）';
      });

      function fetchList() {
        loading.value = true;
        api.fetchForkliftList({
          warehouseZone: query.value.warehouseZone,
          keyword: query.value.keyword
        }).then(function (res) {
          list.value = res.list;
        }).catch(function (e) {
          ElMessage.error('查询失败：' + e.message);
        }).finally(function () {
          loading.value = false;
        });
      }

      function handleSearch() {
        pageNo.value = 1;
        fetchList();
      }

      function handleReset() {
        query.value = { warehouseZone: '', keyword: '' };
        pageNo.value = 1;
        fetchList();
      }

      function handlePageChange(p) { pageNo.value = p; }

      function handleSizeChange(s) {
        pageSize.value = s;
        pageNo.value = 1;
      }

      /** 导出：只导当前查询结果（list 即当前查询返回的全量数据） */
      function handleExport() {
        if (!list.value.length) {
          ElMessage.warning('当前查询结果为空，无可导出数据');
          return;
        }
        var csv = api.buildForkliftCsv(list.value);
        api.downloadCsv(csv, '叉车档案_' + fileTimestamp() + '.csv');
        ElMessage.success('已导出 ' + list.value.length +  '条（当前查询结果）');
      }

      /* 表格序号（跨页连续） */
      function rowIndex(index) {
        return (pageNo.value - 1) * pageSize.value + index + 1;
      }

      /* 年检日期提示：已过期 / 30 天内临期 */
      function inspectionTip(dateStr) {
        if (!dateStr) return null;
        var today = new Date();
        today.setHours(0, 0, 0, 0);
        var d = new Date(dateStr + 'T00:00:00');
        var diffDays = Math.round((d - today) / 86400000);
        if (diffDays < 0) return { type: 'danger', text: '已过期' };
        if (diffDays <= 30) return { type: 'warning', text: '临期' };
        return null;
      }

      Vue.onMounted(fetchList);

      return {
        query: query,
        list: list,
        loading: loading,
        pageNo: pageNo,
        pageSize: pageSize,
        total: total,
        pagedList: pagedList,
        filterSummary: filterSummary,
        warehouseZoneOptions: api.WAREHOUSE_ZONE_OPTIONS,
        zoneLabel: api.zoneLabel,
        statusMeta: api.statusMeta,
        fetchList: fetchList,
        handleSearch: handleSearch,
        handleReset: handleReset,
        handlePageChange: handlePageChange,
        handleSizeChange: handleSizeChange,
        handleExport: handleExport,
        rowIndex: rowIndex,
        inspectionTip: inspectionTip
      };
    }
  });

  app.use(window.ElementPlus);
  app.mount('#app');
})();
