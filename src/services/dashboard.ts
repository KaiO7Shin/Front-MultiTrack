import type {
  Course,
  CourseStatus,
  CourseType,
  ParticipantProjection,
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
    dsq: number;
  };
  resultats: {
    departs: number;
    arrivees: number;
    enAttenteArrivee: number;
    disqualifications: number;
  };
  liveCourses: LiveCourseSummary[];
};

function countParticipants(participants: ParticipantProjection[]) {
  return {
    total: participants.length,
    inscrits: participants.filter((p) => p.statut === "Inscrit").length,
    presents: participants.filter((p) => p.statut === "Present").length,
    enCourse: participants.filter((p) => p.statut === "En course").length,
    dnf: participants.filter((p) => p.statut === "DNF").length,
    dns: participants.filter((p) => p.statut === "DNS").length,
    dsq: participants.filter((p) => p.statut === "DSQ").length,
  };
}

function summarizeCourses(courses: Course[]) {
  const byType: Record<CourseType, number> = { TRAIL: 0, DH: 0, XC: 0, ENDURO: 0 };
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
  const participantCounts = countParticipants(allParticipants);

  const liveCourses: LiveCourseSummary[] = courses
    .filter((c) => c.status === "En cours")
    .map((course) => {
      const plist =
        participantsByCourse.find((x) => x.courseId === course.id)
          ?.participants ?? [];

      return {
        id: course.id,
        name: course.name,
        type: course.type,
        status: course.status,
        participantCount: plist.length,
        presentCount: plist.filter((p) => p.statut === "Present").length,
        enCourseCount: plist.filter((p) => p.statut === "En course").length,
        arriveeCount: 0,
        departCount: 0,
      };
    });

  return {
    courses: summarizeCourses(courses),
    participants: participantCounts,
    resultats: {
      departs: 0,
      arrivees: allParticipants.filter((p) => p.statut === "Finisher").length,
      enAttenteArrivee: 0,
      disqualifications: participantCounts.dsq,
    },
    liveCourses,
  };
}
