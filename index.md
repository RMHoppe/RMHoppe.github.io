---
layout: default
---

## About Me

I am a researcher specializing in the use of FGK-type stars — spanning Sun-like stars to evolved red giants — to investigate nucleosynthesis and the chemical evolution of our galaxy. My work focuses on applying 3D non-LTE spectral modeling techniques to analyze stellar spectra. This approach enhances the accuracy of stellar parameters and chemical abundance determinations, which is crucial for large-scale stellar surveys such as 4MOST, where I am directly involved.

## Research Interests
- **Stellar Atmospheres:** Developing and applying 3D radiation-hydrodynamic simulations to improve the accuracy of stellar parameters and abundance determinations.  
- **Stellar Spectroscopy:** Advancing 3D non-LTE spectroscopy tools and making these methods more accessible to the community.  
- **Galactic Chemical Evolution:** Using stars as tracers to study nucleosynthesis and the chemical enrichment history of the Milky Way.  
- **Computational Astrophysics:** Constructing grids of synthetic stellar spectra to support machine learning applications in stellar classification and analysis.
- **Atomic and Molecular Physics:** The foundation of spectroscopy — accurate atomic and molecular data enable us to extract reliable astrophysical insights! 

My research primarily focuses on the photosphere, which is the layer of stellar atmospheres where the most photons escape into space. Although stars do not have a solid surface, the photosphere is often referred to as the "surface" of the star, as it is the layer we observe. Below is a sketch I created that illustrates the different layers of the Sun.

![alt text](/assets/img/BlenderSun.jpeg "Solar Sketch")

<h3>1D vs 3D stellar models:</h3>
While 1D stellar models tabulate unique temperatures and densities as a function of radius, 3D radiation-hydrodynamic modles include horizontal inhomogeneities and time-dependence in these quantities. It is common to plot the state variables as a function of optical depth $\tau$, rather than radius. $\log\tau=0$ roughly defines the optical surface of all stars, even if they have very different radii.

{::nomarkdown}
<select id="pdfSelector" onchange="loadPDF()">
  <option value="">--Select an Atmosphere--</option>
  <option value="assets/Stagger_figures/5750_45_-0_temp.pdf" selected>Teff_logg_FeH_var.pdf</option>
  {% for pdf in site.static_files %}
      {% if pdf.path contains 'assets/Stagger_figures/' and pdf.extname == '.pdf' %}
          <option value="{{ pdf.path }}">{{ pdf.name }}</option>
      {% endif %}
  {% endfor %}
</select>

<div id="my-pdf"></div>
<script src="https://unpkg.com/pdfobject"></script>
<script>
  function loadPDF() {
    var selector = document.getElementById("pdfSelector");
    var selectedPDF = selector.value;
    
    if (selectedPDF) {
        PDFObject.embed(selectedPDF, "#my-pdf");
    } else {
        document.getElementById("my-pdf").innerHTML = ""; // Clear the PDF viewer
    }
  }

  // Trigger loadPDF on page load to display the default PDF
  document.addEventListener("DOMContentLoaded", function() {
      // Load the default PDF
      loadPDF();
  });
</script>
{:/nomarkdown}

<!-- 

Text can be **bold**, _italic_, or ~~strikethrough~~.

[Link to another page](./another-page.html).

There should be whitespace between paragraphs.

There should be whitespace between paragraphs. We recommend including a README, or a file with information about your project.

# Header 1

This is a normal paragraph following a header. GitHub is a code hosting platform for version control and collaboration. It lets you and others work together on projects from anywhere.

## Header 2

> This is a blockquote following a header.
>
> When something is important enough, you do it even if the odds are not in your favor.

### Header 3

```js
// Javascript code with syntax highlighting.
var fun = function lang(l) {
  dateformat.i18n = require('./lang/' + l)
  return true;
}
```

```ruby
# Ruby code with syntax highlighting
GitHubPages::Dependencies.gems.each do |gem, version|
  s.add_dependency(gem, "= #{version}")
end
```

#### Header 4

*   This is an unordered list following a header.
*   This is an unordered list following a header.
*   This is an unordered list following a header.

##### Header 5

1.  This is an ordered list following a header.
2.  This is an ordered list following a header.
3.  This is an ordered list following a header.

###### Header 6

| head1        | head two          | three |
|:-------------|:------------------|:------|
| ok           | good swedish fish | nice  |
| out of stock | good and plenty   | nice  |
| ok           | good `oreos`      | hmm   |
| ok           | good `zoute` drop | yumm  |

### There's a horizontal rule below this.

* * *

### Here is an unordered list:

*   Item foo
*   Item bar
*   Item baz
*   Item zip

### And an ordered list:

1.  Item one
1.  Item two
1.  Item three
1.  Item four

### And a nested list:

- level 1 item
  - level 2 item
  - level 2 item
    - level 3 item
    - level 3 item
- level 1 item
  - level 2 item
  - level 2 item
  - level 2 item
- level 1 item
  - level 2 item
  - level 2 item
- level 1 item

### Small image

![Octocat](https://github.githubassets.com/images/icons/emoji/octocat.png)

### Large image

![Branching](https://guides.github.com/activities/hello-world/branching.png)


### Definition lists can be used with HTML syntax.

<dl>
<dt>Name</dt>
<dd>Godzilla</dd>
<dt>Born</dt>
<dd>1952</dd>
<dt>Birthplace</dt>
<dd>Japan</dd>
<dt>Color</dt>
<dd>Green</dd>
</dl>

```
Long, single-line code blocks should not wrap. They should horizontally scroll if they are too long. This line should be long enough to demonstrate this.
```

```
The final element.
``` -->
