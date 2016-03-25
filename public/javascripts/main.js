/*$(document).ready(function () {
    alert("main.js: me");
    $('.topButton').on('click', function() {
        alert("main.js: button click here");
        $('.topButton').removeClass('selected');
        $(this).addClass('selected');
    });
});
*/
function homeButtonClick () {
    alert("main.js: home click.");
    location.href = "/";
    alert("main.js: button click here");
    $('.topButton').removeClass('selected');
    $('.homeButton').addClass('buttonSelected');
    /*$('.topButton').on('click', function() {
        alert("button click here");
        $('.topButton').removeClass('selected');
        $('.homeButton').addClass('buttonSelected');
    });*/
}
