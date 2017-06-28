/**
 * Created by 99116 on 2017/2/28.
 */
var PageInfo = {};

PageInfo.init = function(pageNum,pageSize,totalRecords){
    PageInfo.pageNum = pageNum;
    PageInfo.pageSize = pageSize;
    PageInfo.start = (pageNum-1)*pageSize;
    PageInfo.totalPages = parseInt(totalRecords/pageSize)+1;
}

PageInfo.setResult = function(rows){
    PageInfo.rows = rows;
}

module .exports = PageInfo;