const ANSWERS = {
  q1: 'B',
  q2: 'A',
  q3: 'C',
  q4: 'A',
  q5: 'A',
};

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('quiz-form');
  const result = document.getElementById('result');

  // ✅ NEW: Get the start button
  const startBtn = document.getElementById('start-btn');

  // ✅ NEW: Show form only after clicking start
  startBtn.addEventListener('click', () => {
    form.style.display = 'block';
    startBtn.style.display = 'none';
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    let score = 0;
    const total = Object.keys(ANSWERS).length;

    // Clear previous feedback
    form.querySelectorAll('.option').forEach(el => {
      el.classList.remove('correct', 'wrong');
    });
    form.querySelectorAll('.feedback').forEach(el => {
      el.textContent = '';
      el.className = 'feedback';
    });

    for (const [q, correct] of Object.entries(ANSWERS)) {
      const selected = form.querySelector(`input[name="${q}"]:checked`);
      const block = form.querySelector(`[data-question="${q}"]`);
      const feedback = block.querySelector('.feedback');

      if (!selected) {
        feedback.textContent = 'Please select an answer.';
        feedback.classList.add('wrong');
        continue;
      }

      if (selected.value === correct) {
        score++;
        feedback.textContent = '✔ Correct';
        feedback.classList.add('correct');
        selected.classList.add('correct');
      } else {
        feedback.textContent = `✘ Wrong — Correct answer: ${correct}`;
        feedback.classList.add('wrong');
        selected.classList.add('wrong');

        const correctInput = form.querySelector(`input[name="${q}"][value="${correct}"]`);
        if (correctInput) correctInput.classList.add('correct');
      }
    }

    result.textContent = `Score: ${score} / ${total} (${Math.round((score / total) * 100)}%)`;
    result.style.display = 'block';
  });
});