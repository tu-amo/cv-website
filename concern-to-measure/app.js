document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('worksheetForm');
    const printBtn = document.getElementById('printBtn');
    const clearBtn = document.getElementById('clearBtn');
    const STORAGE_KEY = 'concern_to_measure_v1';

    // 1. Auto-save functionality
    const saveToLocal = () => {
        const formData = new FormData(form);
        const data = {};

        // Handle normal inputs
        formData.forEach((value, key) => {
            if (!data[key]) {
                data[key] = value;
            } else {
                // Handle multiple checkboxes with same name
                if (!Array.isArray(data[key])) {
                    data[key] = [data[key]];
                }
                data[key].push(value);
            }
        });

        // Specific fix for checkboxes that might be empty
        // (FormData doesn't include unchecked boxes)
        const allCheckboxes = form.querySelectorAll('input[type="checkbox"]');
        allCheckboxes.forEach(cb => {
            if (!cb.checked && !data[cb.name]) {
                data[cb.name] = [];
            }
        });

        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    };

    // 2. Load functionality
    const loadFromLocal = () => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (!saved) return;

        const data = JSON.parse(saved);

        Object.keys(data).forEach(key => {
            const val = data[key];
            const elements = form.querySelectorAll(`[name="${key}"]`);

            if (elements.length > 0) {
                if (elements[0].type === 'checkbox') {
                    elements.forEach(el => {
                        el.checked = Array.isArray(val) ? val.includes(el.value) : val === el.value;
                    });
                } else if (elements[0].type === 'radio') {
                    elements.forEach(el => {
                        el.checked = el.value === val;
                    });
                } else {
                    elements[0].value = val;
                }
            }
        });

        // Final resize trigger for textareas
        adjustAllTextareas();
    };

    // 3. Dynamic Textarea sizing (optional but nice)
    const adjustAllTextareas = () => {
        form.querySelectorAll('textarea').forEach(ta => {
            ta.style.height = 'auto';
            ta.style.height = (ta.scrollHeight) + 'px';
        });
    };

    // Events
    form.addEventListener('input', saveToLocal);

    printBtn.addEventListener('click', () => {
        window.print();
    });

    clearBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to clear all data? This cannot be undone.')) {
            localStorage.removeItem(STORAGE_KEY);
            form.reset();
            adjustAllTextareas();
        }
    });

    // Handle textarea auto-grow
    form.addEventListener('input', e => {
        if (e.target.tagName.toLowerCase() === 'textarea') {
            e.target.style.height = 'auto';
            e.target.style.height = (e.target.scrollHeight) + 'px';
        }
    });

    // Initialize
    loadFromLocal();
});
