const API_BASE = 'http://localhost:3001';

document.addEventListener('DOMContentLoaded', () => {
    const galleryView = document.getElementById('view-gallery');
    const cookingView = document.getElementById('view-cooking');
    const gridContainer = document.getElementById('recipe-grid');

    // 1. Fetch Recipes for Gallery on Load
    async function loadGallery() {
        try {
            const res = await fetch(`${API_BASE}/recipes`);
            const recipes = await res.json();

            gridContainer.innerHTML = '';

            recipes.forEach(recipe => {
                const totalTime = (recipe.prep_time_minutes || 0) + (recipe.cook_time_minutes || 0);
                const tagsHtml = (recipe.tags || []).map(tag => `<span class="tag">${tag}</span>`).join('');

                const card = document.createElement('article');
                card.className = 'recipe-card';
                card.onclick = () => window.openCookingMode(recipe.id);
                card.innerHTML = `
                    <div class="recipe-card-img-wrapper">
                        <img src="${recipe.image || 'https://images.unsplash.com/photo-1495521821757-a1efb6729352?auto=format&fit=crop&q=80&w=2670'}"
                            alt="${recipe.title}" class="recipe-card-img">
                    </div>
                    <div class="recipe-card-content">
                        <h2 class="recipe-card-title font-heading">${recipe.title}</h2>
                        <div class="recipe-card-meta">
                            <span>⏱️ ${totalTime} mins</span>
                            <span>📖 ${recipe.reference_source || 'Custom'}</span>
                        </div>
                        <div class="recipe-card-tags">
                            ${tagsHtml}
                        </div>
                    </div>
                `;
                gridContainer.appendChild(card);
            });
        } catch (err) {
            console.error('Failed to load recipes', err);
            gridContainer.innerHTML = '<p style="color:var(--color-accent-amber);">Error connecting to database. Make sure your local server is running.</p>';
        }
    }

    // Load initial data
    loadGallery();

    // 2. Navigation & Fetch Recipe Details
    window.openCookingMode = async (recipeId) => {
        try {
            // Fetch Recipe details
            const [recipeRes, stepsRes, rawIngredientsRes, allIngredientsRes] = await Promise.all([
                fetch(`${API_BASE}/recipes/${recipeId}`),
                fetch(`${API_BASE}/instruction_steps?recipe_id=${recipeId}`),
                fetch(`${API_BASE}/recipe_ingredients?recipe_id=${recipeId}`),
                fetch(`${API_BASE}/ingredients`) // Fetch all to manually map IDs
            ]);

            const recipe = await recipeRes.json();
            const steps = await stepsRes.json();
            const recipeIngredients = await rawIngredientsRes.json();
            const allIngredients = await allIngredientsRes.json();

            // Render Header
            document.getElementById('view-img').src = recipe.image || 'https://images.unsplash.com/photo-1495521821757-a1efb6729352?auto=format&fit=crop&q=80&w=2670';
            document.getElementById('view-reference').textContent = recipe.reference_source || '';
            document.getElementById('view-title').textContent = recipe.title;
            document.getElementById('btn-edit-recipe').href = `add_recipe.html?id=${recipe.id}`;
            document.getElementById('view-meta').innerHTML = `
                <span><strong>Prep:</strong> ${recipe.prep_time_minutes || 0} mins</span>
                <span><strong>Cook:</strong> ${recipe.cook_time_minutes || 0} mins</span>
                <span><strong>Serves:</strong> ${recipe.servings || '-'}</span>
            `;

            // Render Ingredients
            const ingList = document.getElementById('view-ingredients');
            ingList.innerHTML = '';
            recipeIngredients.forEach(ri => {
                const ingDetails = allIngredients.find(i => i.id === ri.ingredient_id);
                const name = ingDetails ? ingDetails.name : 'Unknown ingredient';
                const prep = ri.preparation_note ? `, ${ri.preparation_note}` : '';

                const li = document.createElement('li');
                li.className = 'ingredient-item';
                li.innerHTML = `
                    <div class="checkbox"></div>
                    <span class="ingredient-text">${ri.quantity || ''} ${ri.unit || ''} ${name}${prep}</span>
                `;
                // Add toggle logic
                li.onclick = () => li.classList.toggle('checked');
                ingList.appendChild(li);
            });

            // Render Steps
            const stepsList = document.getElementById('view-steps');
            stepsList.innerHTML = '';
            steps.sort((a, b) => a.step_number - b.step_number).forEach((step, index) => {
                const card = document.createElement('div');
                card.className = `step-card ${index === 0 ? 'active' : ''}`;
                card.innerHTML = `
                    <span class="step-number">${step.step_number || (index + 1)}</span>
                    <p class="step-text">${step.instruction_text}</p>
                `;
                stepsList.appendChild(card);
            });

            // Re-bind Step Click Interactions
            bindStepInteractions();

            // Visual transition
            galleryView.style.display = 'none';
            cookingView.style.display = 'flex';
            document.querySelector('.cooking-right').scrollTop = 0;

        } catch (err) {
            console.error('Failed to fetch recipe details', err);
            alert("Could not load recipe details.");
        }
    };

    window.closeCookingMode = () => {
        cookingView.style.display = 'none';
        galleryView.style.display = 'block';
    };

    // 3. Step Interaction Logic
    function bindStepInteractions() {
        const stepsDom = document.querySelectorAll('.step-card');
        stepsDom.forEach((step, index) => {
            step.addEventListener('click', function () {
                stepsDom.forEach((s, i) => {
                    if (i < index) {
                        s.classList.remove('active');
                        s.classList.add('completed');
                    } else if (i === index) {
                        s.classList.add('active');
                        s.classList.remove('completed');
                    } else {
                        s.classList.remove('active', 'completed');
                    }
                });

                // Try to start timer if text has "highlight"
                const highlight = this.querySelector('.highlight');
                if (highlight && highlight.dataset.time) {
                    window.startTimer(parseInt(highlight.dataset.time));
                }
            });
        });
    }

    // 4. Timer Widget Logic
    let timerInterval;
    let remainingSeconds = 0;

    const timerWidget = document.getElementById('timer-widget');
    const timerDisplay = document.getElementById('timer-display');
    const timerLabel = document.getElementById('timer-label');
    const timerRing = document.getElementById('timer-ring');

    function updateTimerDisplay(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        timerDisplay.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    window.startTimer = (minutes) => {
        clearInterval(timerInterval);
        remainingSeconds = minutes * 60;
        timerWidget.classList.remove('hidden');
        timerRing.style.animation = 'pulse 2s infinite linear';
        timerLabel.textContent = "Running";

        updateTimerDisplay(remainingSeconds);

        timerInterval = setInterval(() => {
            remainingSeconds--;
            if (remainingSeconds <= 0) {
                clearInterval(timerInterval);
                timerDisplay.textContent = "00:00";
                timerLabel.textContent = "Ready!";
                timerRing.style.animation = 'none';
                timerRing.style.borderColor = "red";
            } else {
                updateTimerDisplay(remainingSeconds);
            }
        }, 1000);
    };

    window.pauseResetTimer = () => {
        if (remainingSeconds > 0) {
            clearInterval(timerInterval);
            timerLabel.textContent = "Paused";
            timerRing.style.animation = 'none';
        } else {
            timerWidget.classList.add('hidden');
        }
    };
});
