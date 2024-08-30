// Import Axios (this is only needed if you're using a module system, otherwise Axios is already globally available via the script tag)
// import axios from 'axios';

console.log('Axios Script Loaded');

// The breed selection input element.
const breedSelect = document.getElementById("breedSelect");
// The information section div element.
const infoDump = document.getElementById("infoDump");
// The progress bar div element.
const progressBar = document.getElementById("progressBar");
// The get favourites button element.
const getFavouritesBtn = document.getElementById("getFavouritesBtn");

// Set default Axios configurations.
axios.defaults.baseURL = 'https://api.thecatapi.com/v1';
axios.defaults.headers.common['x-api-key'] = 'live_UyrgXoFPtSnifxcQPnQs7vcsGCyQnE8RE0Ug0HDVG2yZbGXJw3iW2upEvBBzIisc';

// Add Axios interceptors
axios.interceptors.request.use(request => {
    request.meta = request.meta || {};
    request.meta.requestStartedAt = Date.now(); // Record the start time of the request
    console.log(`Request started: ${request.method.toUpperCase()} ${request.url}`);
    
    // Reset progress bar
    progressBar.style.width = '0%';

    // Set cursor to progress
    document.body.style.cursor = 'progress';
    
    return request;
});

axios.interceptors.response.use(response => {
    const timeTaken = Date.now() - response.config.meta.requestStartedAt;
    console.log(`Response received: ${response.status} ${response.statusText} (Time taken: ${timeTaken}ms)`);
    
    // Set cursor to default
    document.body.style.cursor = 'default';
    
    return response;
}, error => {
    // Handle error case
    if (error.response) {
        const timeTaken = Date.now() - error.config.meta.requestStartedAt;
        console.error(`Error response received: ${error.response.status} ${error.response.statusText} (Time taken: ${timeTaken}ms)`);
    } else {
        console.error(`Error: ${error.message}`);
    }

    // Set cursor to default
    document.body.style.cursor = 'default';

    return Promise.reject(error);
});

// Create the updateProgress function
function updateProgress(event) {
    if (event.lengthComputable) {
        const percentCompleted = Math.round((event.loaded * 100) / event.total);
        console.log('Progress Event:', event); // Log the ProgressEvent object
        progressBar.style.width = `${percentCompleted}%`; // Update the progress bar
    }
}

// Initial Load Function
async function initialLoad() {
    try {
        const response = await axios.get('/breeds');
        const breeds = response.data;
        console.log('Breeds:', breeds); // Debugging line

        breeds.forEach(breed => {
            const option = document.createElement('option');
            option.value = breed.id; // Set the value attribute to the breed id
            option.textContent = breed.name; // Set the text content to the breed name
            breedSelect.appendChild(option); // Append the option to the breedSelect element
        });

        // Call handleBreedSelection to load initial breed data
        handleBreedSelection();

    } catch (error) {
        console.error("Error fetching breeds: ", error);
    }
}

// Event handler for breedSelect
async function handleBreedSelection() {
    const selectedBreedId = breedSelect.value;

    try {
        // Fetch breed images and info from the Cat API using Axios
        const response = await axios.get(`/images/search`, {
            params: {
                breed_ids: selectedBreedId,
                limit: 5
            },
            onDownloadProgress: updateProgress // Pass the updateProgress function here
        });
        const images = response.data;
        console.log('Images:', images); // Debugging line

        // Clear the current carousel and info section
        const carouselInner = document.getElementById('carouselInner');
        carouselInner.innerHTML = ''; // Clear carousel
        infoDump.innerHTML = ''; // Clear info section

        // Populate carousel with new images
        images.forEach(imageData => {
            const carouselItemTemplate = document.getElementById('carouselItemTemplate');
            const carouselItem = carouselItemTemplate.content.cloneNode(true);
            const imgElement = carouselItem.querySelector('img');
            imgElement.src = imageData.url;
            carouselInner.appendChild(carouselItem);
        });

        // Set the first carousel item as active
        if (carouselInner.firstElementChild) {
            carouselInner.firstElementChild.classList.add('active');
        }

        // Populate the info section with breed details
        const breedInfo = images[0].breeds[0];
        const breedDetails = `
            <h3>${breedInfo.name}</h3>
            <p><strong>Origin:</strong> ${breedInfo.origin}</p>
            <p><strong>Description:</strong> ${breedInfo.description}</p>
            <p><strong>Temperament:</strong> ${breedInfo.temperament}</p>
            <p><strong>Life Span:</strong> ${breedInfo.life_span} years</p>
            <p><strong>Wikipedia:</strong> <a href="${breedInfo.wikipedia_url}" target="_blank">${breedInfo.wikipedia_url}</a></p>
        `;
        infoDump.innerHTML = breedDetails;

    } catch (error) {
        console.error("Error fetching breed images: ", error);
    }
}

// Toggle favourite function
async function favourite(imgId) {
    try {
        const isFavourited = document.querySelector(`.favourite-button[data-img-id="${imgId}"]`).classList.contains("favourited");
        if (isFavourited) {
            // Delete the favourite
            await axios.delete(`/favourites/${imgId}`);
        } else {
            // Add the favourite
            await axios.post('/favourites', { image_id: imgId });
        }
    } catch (error) {
        console.error('Error toggling favourite:', error);
    }
}

// Get favourites function
async function getFavourites() {
    try {
        const response = await axios.get('/favourites');
        return response.data;
    } catch (error) {
        console.error('Error fetching favourites:', error);
        return [];
    }
}

// Display favourites function
async function displayFavourites() {
    // Clear the current carousel and info section
    const carouselInner = document.getElementById('carouselInner');
    carouselInner.innerHTML = ''; // Clear carousel
    infoDump.innerHTML = ''; // Clear info section

    try {
        const favourites = await getFavourites();

        favourites.forEach(fav => {
            const carouselItemTemplate = document.getElementById('carouselItemTemplate');
            const carouselItem = carouselItemTemplate.content.cloneNode(true);
            const imgElement = carouselItem.querySelector('img');
            imgElement.src = fav.image.url; // Adjust according to API response
            carouselInner.appendChild(carouselItem);
        });

        // Set the first carousel item as active
        if (carouselInner.firstElementChild) {
            carouselInner.firstElementChild.classList.add('active');
        }

        // Additional info for favourites, if needed
        // You might want to display additional info about the favourites here

    } catch (error) {
        console.error('Error displaying favourites:', error);
    }
}


// Attach event handlers
breedSelect.addEventListener('change', handleBreedSelection);
getFavouritesBtn.addEventListener('click', displayFavourites);

// Call the initialLoad function to kick off the process
initialLoad();
