/**
 * Created by 99116 on 2017/2/22.
 */
$(function(){
    var $html = $("<ul id='suggest' style='display: block;width:20%;'></ul>").hide().insertAfter("#stockName");//定义一个html标签
    $("#stockName").keyup(function(event){
        var key = $(this).val();
        var url = "http://www.upchina.com/media/stock/list_hs/"+key;
        $.ajax({
            url:url, //后台地址
            type:"POST",
            data:{"keyword":key},//参数 把文本框的值传到后台
            dataType:'json',
            success: function(data){
                if(data!=undefined&&data.length){  //判断josn个数
                    $html.empty();
                    $.each(data,function(index,tem){
                        $("<li></li>").text(tem.stkCode+'-'+tem.stkShortName).appendTo($('#suggest')).mouseover(function(){
                            $(this).css("background", "#999999");
                        }).mouseout(function() {
                            $(this).css("background", "white");
                        }).click(function() {
                            $("#stockName").val(tem.stkShortName);
                            $("#stockCode").val(tem.stkCode);
                            $("#stockMar").val(tem.secMarPar);
                            $('#suggest').hide();
                        });
                    })
                    $html.show(); //按下触发div显示
                }
            }

        });
    });
    $("#stockName").change(function(){
        $("#stockCode").val('');
    });
});