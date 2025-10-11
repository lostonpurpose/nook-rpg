document.getElementById("load").addEventListener("click", () => {
    
    const gender = document.getElementById("gender").value;
    const limit = 5;
    const category = "shoes"
    const url = `https://kl4hylidcs3k4fazx4aojk2wpe0fbksa.lambda-url.ap-northeast-1.on.aws/items/random?limit=${limit}&genders=${gender}&categories=${category}`;


    // Fetch data from the API endpoint
    fetch(url)
      .then(res => res.json()) // 'res' is the response object from the server. .json() converts it to JS object/array
      .then(data => {          // 'data' is now the array of items returned by the API
        const container = document.getElementById("items"); // Get the div where we will show items
        container.innerHTML = ""; // clear old items

        data.forEach(item => { // Loop over each item in the array
          const div = document.createElement("div"); // Create a new div for this item

          // Add HTML content inside the div
        div.innerHTML = `
            <h3>${item.brand_name}</h3>              <!-- Item title -->
            <p>Price: ¥${item.price}</p>        <!-- Item price -->
            <img src="${item.image_url}" alt="${item.title}" width="200"> <!-- Item image from S3 -->
            <p>Type: ${item.category}
        `;

          container.appendChild(div); // Add this div to the main container
        });
        console.log(data);
    })
      .catch(err => console.error(err)); // Log any errors if the fetch fails
});