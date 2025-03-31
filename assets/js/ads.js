document.addEventListener("DOMContentLoaded", function () {
  const API_KEY = "9zrJqyDsbjBL8zrStiNn1KCC9ge3rkTz70YEB4wB";
  const QUERY = "orcid:0000-0002-8451-6260";
  const URL = `https://api.adsabs.harvard.edu/v1/search/query?q=${QUERY}&fl=title,author,pubdate,bibcode&rows=10&sort=date desc`;

  fetch(URL, {
      headers: { Authorization: `Bearer ${API_KEY}` },
  })
      .then(response => response.json())
      .then(data => {
          let papers = data.response.docs;
          let table = `<table>
              <tr><th>Year</th><th>Title</th><th>Authors</th></tr>`;

          papers.forEach(paper => {
              let year = paper.pubdate ? paper.pubdate.slice(0, 4) : "N/A";
              let title = paper.title ? paper.title[0] : "No Title";
              let link = `https://ui.adsabs.harvard.edu/abs/${paper.bibcode}`;
              let authors = (paper.author || []).slice(0, 3).join(", ");
              authors += paper.author.length > 3 ? " et al." : "";

              table += `<tr>
                  <td>${year}</td>
                  <td><a href="${link}" target="_blank">${title}</a></td>
                  <td>${authors}</td>
              </tr>`;
          });

          table += "</table>";
          document.getElementById("papers-list").innerHTML = table;
      })
      .catch(error => console.error("Error fetching ADS data:", error));
});
