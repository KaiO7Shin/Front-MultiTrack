import { Link } from "react-router-dom";
import {
  RaceBikeIcon,
  RaceCoinsIcon,
  RaceLeafIcon,
  RaceMountainIcon,
  RacePinIcon,
} from "../components/icons";
import { useState, type MouseEvent } from "react";
import { LoadingOverlay } from "../components/LoadingOverlay";
import { Page } from "../components/Layout";
import { useCourses } from "../hooks/useCourses";
import { apiDownloadHref, downloadBinary } from "../lib/downloadBinary";
import { courseGroupTitle } from "../services/catalogService";

function courseGpxFilename(libelle: string) {
  const name = libelle.replace(/[\\/:*?"<>|]/g, " ").replace(/\s+/g, " ").trim() || "course";
  return name.toLowerCase().endsWith(".gpx") ? name : `${name}.gpx`;
}

function courseGpxPath(courseId: number) {
  return `/api/courses/${courseId}/gpx`;
}

async function downloadCourseGpx(courseId: number, libelle: string) {
  await downloadBinary(courseGpxPath(courseId), courseGpxFilename(libelle), {
    networkErrorMessage: "Impossible de télécharger le fichier GPX. Vérifiez votre connexion.",
    fallbackErrorMessage: "Impossible de télécharger le fichier GPX",
    emptyErrorMessage: "Le fichier GPX est introuvable ou inaccessible",
  });
}

function formatStatNumber(value: number, maximumFractionDigits: number) {
  if (!Number.isFinite(value)) return "—";
  return new Intl.NumberFormat("fr-FR", { maximumFractionDigits }).format(value);
}

function CourseBadgeIcon({ type }: { type: string }) {
  const normalized = type.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
  if (normalized.includes("vtt") || normalized.includes("bike")) return <RaceBikeIcon />;
  return <RaceLeafIcon />;
}

export function CoursesPage() {
  const { groups, loading, error } = useCourses();
  const [gpxError, setGpxError] = useState<string | null>(null);

  async function handleGpxDownload(
    event: MouseEvent<HTMLAnchorElement>,
    courseId: number,
    libelle: string,
  ) {
    event.preventDefault();
    setGpxError(null);
    try {
      await downloadCourseGpx(courseId, libelle);
    } catch (reason: unknown) {
      setGpxError(reason instanceof Error ? reason.message : "Impossible de télécharger le fichier GPX");
    }
  }

  return (
    <Page
      title="Nos challenges"
      intro="Choisissez le défi qui vous correspond."
      compact
      action={
        <Link className="button button-outline" to="/categories">
          Catégories
        </Link>
      }
      meta={gpxError ? <p className="form-error" role="alert">{gpxError}</p> : null}
    >
      <LoadingOverlay visible={loading} />
      {error && (
        <div className="empty-results">
          <span className="empty-number">!</span>
          <h2>Impossible de charger les courses</h2>
          <p>{error}</p>
        </div>
      )}
      {!loading && !error && groups.length === 0 && (
        <div className="empty-results">
          <span className="empty-number">0</span>
          <h2>Aucune course pour le moment</h2>
          <p>Les challenges seront bientôt disponibles.</p>
        </div>
      )}
      {!loading && !error && groups.map((group) => (
        <section className="race-group" key={group.typeCourse || "courses"}>
          <h2 className="race-group-title">{courseGroupTitle(group.typeCourse)}</h2>
          <div className="race-grid">
            {group.courses.map((course) => {
              const distance = Number(course.distance);
              const elevation = Number(course.denivele_positif);
              return (
                <article className="race-card" key={course.id}>
                  <div className="race-card-main">
                    <span className="race-badge">
                      <CourseBadgeIcon type={group.typeCourse} />
                      {group.typeCourse || "Course"}
                    </span>
                    <h3>{course.libelle}</h3>
                    {course.description && <p>{course.description}</p>}
                  </div>
                  <div className="race-stats">
                    <div className="race-stat">
                      <RacePinIcon />
                      <strong>
                        {formatStatNumber(distance, 2)}
                        <span>km</span>
                      </strong>
                      <span className="race-stat-label">Distance</span>
                    </div>
                    <div className="race-stat">
                      <RaceMountainIcon />
                      <strong>
                        {formatStatNumber(elevation, 0)}
                        <span>m</span>
                      </strong>
                      <span className="race-stat-label">Dénivelé positif</span>
                    </div>
                    <div className="race-stat">
                      <RaceCoinsIcon />
                      <strong>
                        {formatStatNumber(course.tarif ?? 0, 0)}
                        <span>Ar</span>
                      </strong>
                      <span className="race-stat-label">Tarif</span>
                    </div>
                    <a
                      className="race-gpx"
                      href={apiDownloadHref(courseGpxPath(course.id))}
                      onClick={(event) => handleGpxDownload(event, course.id, course.libelle)}
                      aria-label={`Télécharger le GPX de ${course.libelle}`}
                    >
                      <span className="race-gpx-icon" aria-hidden="true" />
                      GPX
                    </a>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      ))}
    </Page>
  );
}
