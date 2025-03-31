---
layout: default
---

## Contact

**Work Address**

Richard Hoppe

Max-Planck-Institut für Astronomie

Königsstuhl 17

69117 Heidelberg

Email: <span id="email"></span>
<script>
  document.addEventListener("DOMContentLoaded", function () {
    const user = "hoppe";
    const domain = "mpia.de";
    const email = user + "@" + domain;
    document.getElementById("email").innerHTML = `<a href="mailto:${email}">${email}</a>`;
  });
</script>