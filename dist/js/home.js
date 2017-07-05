$(function () {
    $('.join-button').on('click', function () {
        $('.create-form').slideUp();
        $('.join-form').slideToggle();
    });
    $('.create-button').on('click', function () {
        $('.join-form').slideUp();
        $('.create-form').slideToggle();
    });
});
