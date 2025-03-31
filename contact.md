---
layout: default
title: Contact
permalink: /contact/
---

## Contact

**Max Mustermann**  
Musterstraße 1  
12345 Musterstadt, Germany 

Email: <span id="email"></span>
<script>
  document.addEventListener("DOMContentLoaded", function () {
    const user = "hoppe";
    const domain = "mpia.de";
    const email = user + "@" + domain;
    document.getElementById("email").innerHTML = `<a href="mailto:${email}">${email}</a>`;
  });
</script>