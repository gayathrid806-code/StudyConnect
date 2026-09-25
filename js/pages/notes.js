/**
 * Notes Page — curriculum browse + API uploads
 */
document.addEventListener('DOMContentLoaded', () => {
  const content = document.getElementById('notesContent');
  const breadcrumb = document.getElementById('notesBreadcrumb');
  const notesData = SubjectsIndex.curriculum;
  let path = [];

  function renderBreadcrumb() {
    if (!breadcrumb) return;

    let html = '<a href="#" data-level="-1">Notes</a>';

    path.forEach((p, i) => {
      html += ` <span>/</span> <a href="#" data-level="${i}">${p}</a>`;
    });

    breadcrumb.innerHTML = html;

    breadcrumb.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', (e) => {
        e.preventDefault();

        const level = parseInt(a.dataset.level, 10);
        path = level === -1 ? [] : path.slice(0, level + 1);

        render();
      });
    });
  }

  async function render() {
    renderBreadcrumb();

    if (!content) return;

    /* LEVEL 0 — Categories */
    if (path.length === 0) {
      content.innerHTML = `
        <div class="category-grid">
          ${Object.keys(notesData).map(cat => `
            <div class="category-card" data-value="${cat}">
              <div class="category-card-icon">${Icons.graduation}</div>
              <div class="category-card-info">
                <h3>${cat}</h3>
                <p>Browse ${cat} notes</p>
              </div>
              <span class="category-card-arrow">
                ${Icons.chevronRight}
              </span>
            </div>
          `).join('')}
        </div>
      `;
    }

    /* LEVEL 1 — Branches */
    else if (path.length === 1) {
      const branches = Object.keys(notesData[path[0]]);

      content.innerHTML = `
        <div class="notes-grid">
          ${branches.map(b => `
            <div class="note-card" data-value="${b}">
              <div class="note-card-icon">${Icons.book}</div>
              <div class="note-card-title">${b}</div>
              <div class="note-card-meta">
                ${Object.keys(notesData[path[0]][b]).length} semesters
              </div>
            </div>
          `).join('')}
        </div>
      `;
    }

    /* LEVEL 2 — Semesters */
    else if (path.length === 2) {
      const semesters = Object.keys(
        notesData[path[0]][path[1]]
      );

      content.innerHTML = `
        <div class="notes-grid">
          ${semesters.map(s => `
            <div class="note-card" data-value="${s}">
              <div class="note-card-icon">${Icons.file}</div>
              <div class="note-card-title">${s}</div>
              <div class="note-card-meta">
                ${notesData[path[0]][path[1]][s].length} subjects
              </div>
            </div>
          `).join('')}
        </div>
      `;
    }

    /* LEVEL 3 — Subjects */
    else if (path.length === 3) {
      const [course, branch, semester] = path;
      const subjects = notesData[course][branch][semester];

      content.innerHTML = `
        <div class="notes-grid">
          ${subjects.map(sub => `
            <div class="note-card" data-value="${sub}">
              <div class="note-card-icon pdf">
                ${Icons.file}
              </div>

              <div class="note-card-title">
                ${sub}
              </div>

              <div class="note-card-meta">
                Open ${sub} notes
              </div>

              <div class="note-card-actions">
                <span class="btn btn-sm btn-primary">
                  Open ${Icons.chevronRight}
                </span>
              </div>
            </div>
          `).join('')}
        </div>
      `;
    }

    /* LEVEL 4 — One specific subject */
    else if (path.length === 4) {
      const [course, branch, semester, subject] = path;

      let uploaded = [];

      try {
        const qs = new URLSearchParams({
          course,
          branch,
          semester
        });

        const data = await API.request(
          '/api/notes?' + qs.toString()
        );

        uploaded = data.notes || [];
      } catch (_) {
        uploaded = [];
      }

      const files = uploaded.filter(
        n => n.subject === subject
      );

      content.innerHTML = `
        <div style="display:flex;justify-content:flex-end;margin-bottom:var(--space-4)">
          <label class="btn btn-sm btn-primary">
            ${Icons.upload} Upload Notes

            <input
              type="file"
              id="uploadNotesFile"
              hidden
              accept=".pdf,.doc,.docx,.ppt,.pptx,.txt">
          </label>
        </div>

        <div class="note-card">
          <div class="note-card-icon pdf">
            ${Icons.file}
          </div>

          <div class="note-card-title">
            ${subject}
          </div>

          <div class="note-card-meta">
            ${files.length
              ? files.length + ' file(s) uploaded'
              : 'No uploads yet'}
          </div>

          <div class="note-card-actions">
            ${
              files.length
                ? files.map(f => `
                    <a
                      class="btn btn-sm btn-primary"
                      href="${f.fileUrl}"
                      download>
                      ${Icons.download} ${f.author}
                    </a>
                  `).join('')
                : '<span>No notes uploaded yet</span>'
            }
          </div>
        </div>
      `;

      /* Upload ONLY for the selected subject */
      document
        .getElementById('uploadNotesFile')
        ?.addEventListener('change', async (e) => {

          const file = e.target.files[0];

          if (!file) return;

          const body = new FormData();

          body.append('file', file);
          body.append('course', course);
          body.append('branch', branch);
          body.append('semester', semester);

          /* This is now the actual subject opened by the user */
          body.append('subject', subject);

          try {
            await API.request('/api/notes', {
              method: 'POST',
              body
            });

            StudyConnect.toast(
              `${subject} notes uploaded`
            );

            render();

          } catch (err) {
            StudyConnect.toast(err.message);
          }
        });
    }

    /* Navigation */
    content.querySelectorAll('[data-value]').forEach(card => {
      card.addEventListener('click', () => {
        path.push(card.dataset.value);
        render();
      });
    });
  }

  render();
});