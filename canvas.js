console.log('YO YO YO');

const canvas = document.getElementById("signature");
const context = canvas.getContext("2d");

$('#signature').on('mousedown', function(e){
    e.preventDefault();
    context.moveTo(e.pageX - this.offsetLeft, e.pageY - this.offsetTop);
    $('#signature').on('mousemove', function(e){
        context.lineWidth=3;
        context.strokeStyle="#F29191";
        context.lineTo(e.pageX - this.offsetLeft, e.pageY - this.offsetTop);
        context.stroke();
    }).on('mouseup', function(){
        $('#signature').off('mousemove');
        $('input[name="signature"]').val(canvas.toDataURL());

        console.log(canvas.toDataURL('image/png'));
    });
})
