document.addEventListener("DOMContentLoaded", function() {
    // Get all navigation links
    var navLinks = document.querySelectorAll("nav ul li a");
    
    // Loop through each link and add click event listener
    navLinks.forEach(function(link) {
      link.addEventListener("click", function(event) {
        event.preventDefault(); // Prevent default link behavior
        var target = document.querySelector(link.getAttribute("href")); // Get target section
        var offsetTop = target.offsetTop; // Get offset top of target section
        window.scrollTo({ top: offsetTop, behavior: "smooth" }); // Scroll to target section smoothly
      });
    });
  });