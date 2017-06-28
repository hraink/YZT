/**
 * Created by xudong.Cai on 2017/2/10.
 */
;(function () {
    var attrNumRadios = $('.test_main .list');
    var formData = {
        risk1:0,
        risk2:0,
        risk3:0,
        risk4:0,
        risk5:0,
        risk6:0,
        risk7:0,
        risk8:0
    }
    $(function(){
        setFormData();
        initBindFun();
    });
    //设置表单数据
    function setFormData() {
        var n = 0;
        var checkCount = 0;
        //取提交记录
        for (var i in  formData){
            var obj = $(attrNumRadios[n]);
            formData[i] = obj.attr('attr-numRadio')
            obj.find('input[value='+formData[i]+']').attr("checked","checked").parent().find('label').attr('class', 'checked');
            checkCount += Number(formData[i]);
            n++;
        }
        //没有提交记录，取cookie数据
        if (checkCount === 0){
            var _riskInfo = $.getCookie('riskInfo');
            if (_riskInfo === 'undefined'){
                return;
            }
            var riskInfo = JSON.parse(_riskInfo);
            n = 0;
            for (var i in  formData){
                var obj = $(attrNumRadios[n]);
                formData[i] = riskInfo[i];
                obj.find('input[value='+Number(formData[i])+']').attr("checked","checked").parent().find('label').attr('class', 'checked');;
                n++;
            }
        }
        setSubmitBtnStyle();
    }
    //设置提交测试按钮状态
    function setSubmitBtnStyle() {
        var rNum = 0;
        for (var i in  formData){
            if (formData[i] == 0){
                rNum++;
            }
        }
        if (rNum > 0){
            $('#sub_btn').addClass('sub_btned');
        }else {
            $('#sub_btn').removeClass('sub_btned');
        }
    }
    //获取表单数据
    function getFormData() {
        var n = 0;
        for (var i in  formData){
            var obj = $(attrNumRadios[n]);
            formData[i] = obj.find('input:checked').val() || 0;
            if (formData[i] == 0){
                return null;
            }
            n++;
        }
        return formData;
    }
    //提交测评
    function submitRisk(_formData) {
        $.ajax({
            type: "POST",
            url: "/risk/submit",
            data: _formData,
            async: true,
            dataType:'json',
            success:function (data) {
                if (data.status === 0){
                    $.deleteCookie('riskInfo');
                    location.href = '/risk/result.html';
                }else {
                    $('#errorInfo').show();
                }
            },
            error:function (err) {
                $('#errorInfo').show();
            }
        })
    }
    //保存表单数据到Cookie
    function saveCacheFormData() {
        var n = 0;
        for (var i in  formData){
            var obj = $(attrNumRadios[n]);
            formData[i] = obj.find('input:checked').val() || 0;
            n++;
        }
        $.setCookie('riskInfo',JSON.stringify(formData),360);
    }
    //初始化绑定事件
    function initBindFun() {
        // 单选按钮
        $('label').click(function(){
            $(this).parents(".choice").find("label").removeAttr('class');
            $(this).parents(".choice").find("input").removeAttr('checked');
            $(this).prop('class', 'checked');
            $(this).prev().prop('checked', 'checked');
            saveCacheFormData();
            setSubmitBtnStyle()
        });
        //提交评测
        $('.sub_btn').on('click',function () {
            var _formData = getFormData();
            if (_formData == null){
                return false;
            }
            submitRisk(_formData);
        });
        $('#errorInfo button').off('click').on('click',function () {
            $('#errorInfo').hide();
        });
    }
})();