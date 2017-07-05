$(() => {
  $('.join-button').on('click', () => {
    $('.create-form').slideUp()
    $('.join-form').slideToggle()
  })
  $('.create-button').on('click', () => {
    $('.join-form').slideUp()
    $('.create-form').slideToggle()
  })
})
