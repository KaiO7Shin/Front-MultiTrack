import {
  localGetAllResultatsManche,
  localGetDisqualificationsByCourse,
  localGetManches,
  localGetPhases,
} from "@/lib/localData";
import type {
  Course,
  CourseStatus,
  CourseType,
  ParticipantProjection,
  ResultatManche,
} from "@/lib/type";
import { fetchCoursesDetailed } from "@/services/courses";
import { fetchParticipantsByCourse } from "@/services/participants";

export type LiveCourseSummary = {
  id: number;
  name: string;
  type: CourseType;
  status: CourseStatus;
  participantCount: number;
  presentCount: number;
  enCourseCount: number;
  arriveeCount: number;
  departCount: number;
};

export type DashboardStats = {
  courses: {
    total: number;
    enCours: number;
    aVenir: number;
    terminees: number;
    byType: Record<CourseType, number>;
  };
  participants: {
    total: number;
    inscrits: number;
    presents: number;
    enCourse: number;
    dnf: number;
    dns: number;
  };
  resultats: {
    departs: number;
    arrivees: number;
    enAttenteArrivee: number;
    disqualifications: number;
  };
  liveCourses: LiveCourseSummary[];
};

function buildMancheToCourseMap(): Map<number, number> {
  const phaseCourse = new Map(localGetPhases().map((p) => [p.id, p.courseId]));
  const map = new Map<number, number>();
  for (const m of localGetManches()) {
    const courseId = phaseCourse.get(m.phaseId);
    if (courseId != null) map.set(m.id, courseId);
  }
  return map;
}

function aggregateResultatsByCourse(
  resultats: ResultatManche[],
  mancheToCourse: Map<number, number>
): Map<number, { departs: number; arrivees: number }> {
  const byCourse = new Map<number, { departs: number; arrivees: number }>();

  for (const r of resultats) {
    const courseId = mancheToCourse.get(r.mancheId);
    if (courseId == null) continue;

    const cur = byCourse.get(courseId) ?? { departs: 0, arrivees: 0 };
    if (r.tempsDepart) cur.departs += 1;
    if (r.tempsArrive) cur.arrivees += 1;
    byCourse.set(courseId, cur);
  }

  return byCourse;
}

function countParticipants(participants: ParticipantProjection[]) {
  return {
    total: participants.length,
    inscrits: participants.filter((p) => p.statut === "Inscrit").length,
    presents: participants.filter((p) => p.statut === "Present").length,
    enCourse: participants.filter((p) => p.statut === "En course").length,
    dnf: participants.filter((p) => p.statut === "DNF").length,
    dns: participants.filter((p) => p.statut === "DNS").length,
  };
}

function summarizeCourses(courses: Course[]) {
  const byType: Record<CourseType, number> = { TRAIL: 0, DH: 0, XC: 0 };
  for (const c of courses) {
    byType[c.type] += 1;
  }
  return {
    total: courses.length,
    enCours: courses.filter((c) => c.status === "En cours").length,
    aVenir: courses.filter((c) => c.status === "A venir").length,
    terminees: courses.filter((c) => c.status === "Terminee").length,
    byType,
  };
}

export async function fetchDashboardStats(): Promise<DashboardStats> {
  const courses = await fetchCoursesDetailed();

  const participantsByCourse = await Promise.all(
    courses.map(async (course) => ({
      courseId: course.id,
      participants: await fetchParticipantsByCourse(course.id),
    }))
  );

  const allParticipants = participantsByCourse.flatMap((x) => x.participants);
  const resultats = localGetAllResultatsManche();
  const resultatsByCourse = aggregateResultatsByCourse(
    resultats,
    buildMancheToCourseMap()
  );

  const disqualifications = courses.reduce(
    (sum, c) => sum + localGetDisqualificationsByCourse(c.id).length,
    0
  );

  const liveCourses: LiveCourseSummary[] = courses
    .filter((c) => c.status === "En cours")
    .map((course) => {
      const plist =
        participantsByCourse.find((x) => x.courseId === course.id)
          ?.participants ?? [];
      const res = resultatsByCourse.get(course.id);

      return {
        id: course.id,
        name: course.name,
        type: course.type,
        status: course.status,
        participantCount: plist.length,
        presentCount: plist.filter((p) => p.statut === "Present").length,
        enCourseCount: plist.filter((p) => p.statut === "En course").length,
        arriveeCount: res?.arrivees ?? 0,
        departCount: res?.departs ?? 0,
      };
    });

  return {
    courses: summarizeCourses(courses),
    participants: countParticipants(allParticipants),
    resultats: {
      departs: resultats.filter((r) => r.tempsDepart).length,
      arrivees: resultats.filter((r) => r.tempsArrive).length,
      enAttenteArrivee: resultats.filter(
        (r) => r.tempsDepart && !r.tempsArrive
      ).length,
      disqualifications,
    },
    liveCourses,
  };
}
