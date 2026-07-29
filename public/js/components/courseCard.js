// ============================================
// COURSECARD.JS - Card de curso do catálogo
// ============================================

// Recebe um curso e o nome da sua categoria e retorna o HTML do card
export function criarCourseCard(curso, categoriaNome) {
  const capasPorCurso = {
    cur1y3: 'images/courses/javascript.png',
    cur2z4: 'images/courses/react.png',
    cur4v6: 'images/courses/photoshop.png',
    cur5u7: 'images/courses/marketing.png',
  };
  const capasPorCategoria = {
    Programação: 'images/courses/javascript.png',
    Design: 'images/courses/photoshop.png',
    Marketing: 'images/courses/marketing.png',
  };
  const capa = capasPorCurso[curso.id]
    || capasPorCategoria[categoriaNome]
    || 'images/courses/javascript.png';

  return `
    <article class="card course-card" data-id="${curso.id}">
      <a href="curso.html?id=${curso.id}" class="course-card__media" aria-label="Conhecer o curso ${curso.titulo}">
        <img
          class="course-card__image"
          src="${capa}"
          alt=""
          loading="lazy"
          decoding="async"
        />
        <span class="course-card__level">Curso online</span>
      </a>

      <div class="course-card__body">
        <span class="course-card__category">${categoriaNome || 'Categoria'}</span>
        <h3 class="course-card__title">${curso.titulo}</h3>
        <p class="course-card__description">${curso.descricao}</p>

        <div class="course-card__meta">
          <span class="course-card__duration" aria-label="${curso.cargaHoraria} horas de curso">
            <svg aria-hidden="true" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="9"></circle>
              <path d="M12 7v5l3 2"></path>
            </svg>
            ${curso.cargaHoraria}h de conteúdo
          </span>
        </div>
      </div>

      <div class="course-card__footer">
        <a href="curso.html?id=${curso.id}" class="btn course-card__button btn-block">
          Explorar curso
          <span aria-hidden="true">→</span>
        </a>
      </div>
    </article>
  `;
}
