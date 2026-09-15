import { useEffect, useState, type FormEvent } from "react";
import { Link, NavLink, Navigate, Route, Routes, useNavigate, useParams } from "react-router-dom";

type User = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
};

type Runner = {
  id: number;
  firstName: string;
  lastName: string;
  birthDate: string;
  gender: string;
  category: string;
  race: string;
  identityDocument: string;
  medicalCertificate: string;
  parentalAuthorization?: string;
};

type Registration = {
  id: string;
  createdAt: string;
  status: "Validée";
  paymentReference: string;
  paymentMethod: "MVola" | "Orange Money";
  totalAmount: number;
  runner: Runner;
};

type RunnerDraft = {
  firstName: string;
  lastName: string;
  birthDate: string;
  gender: string;
  race: string;
  identityDocument: string;
  medicalCertificate: string;
  parentalAuthorization: string;
};

const EMPTY_DRAFT: RunnerDraft = {
  firstName: "",
  lastName: "",
  birthDate: "",
  gender: "",
  race: "",
  identityDocument: "",
  medicalCertificate: "",
  parentalAuthorization: "",
};

const RACES = [
  { name: "Challenge Initiation", discipline: "Trail", distance: "12 km", price: 45_000, duo: false, description: "Le format idéal pour découvrir le trail et relever un premier défi." },
  { name: "Challenge Explorateur", discipline: "", distance: "16 km", price: 50_000, duo: false, description: "Un parcours d’aventure pour celles et ceux qui veulent aller plus loin." },
  { name: "Challenge Parent-Enfant", discipline: "VTT ou Trail", distance: "10 km", price: 70_000, duo: true, description: "Une aventure complice à vivre et à partager en famille." },
  { name: "Challenge Suprême", discipline: "VTT ou Trail", distance: "25 km", price: 55_000, duo: false, description: "Le défi majeur de TBB pour les sportifs en quête de dépassement." },
  { name: "Challenge des amoureux", discipline: "Trail ou VTT", distance: "25 km", price: 75_000, duo: true, description: "Un challenge en duo pour conjuguer effort, aventure et complicité." },
];

const COURSE_GROUPS = [
  {
    title: "Challenge Trail",
    kind: "Trail",
    races: ["Challenge Initiation", "Challenge Explorateur", "Challenge Parent-Enfant", "Challenge Suprême", "Challenge des amoureux"],
  },
  {
    title: "Challenge VTT",
    kind: "VTT",
    races: ["Challenge Parent-Enfant", "Challenge Suprême", "Challenge des amoureux"],
  },
] as const;

const HIGHLIGHTS = [
  { title: "Trail Run", text: "Défiez les sommets.", icon: <TrailIcon /> },
  { title: "VTT", text: "Parcourez les sentiers.", icon: <BikeIcon /> },
  { title: "Beer Event", text: "Festif et convivial.", icon: <BeerIcon /> },
];

const PAYMENT_NUMBER = "034 00 000 00";

function formatAmount(amount: number) {
  return `${new Intl.NumberFormat("fr-FR").format(amount)} Ar`;
}

function formatRaceLabel(race: (typeof RACES)[number]) {
  return [race.name, race.discipline, race.distance].filter(Boolean).join(" — ");
}

function findRace(raceLabel: string) {
  return RACES.find((race) => raceLabel.startsWith(race.name));
}

function getRacePrice(raceLabel: string) {
  return findRace(raceLabel)?.price ?? 0;
}

function isDuoRace(raceLabel: string) {
  return Boolean(findRace(raceLabel)?.duo);
}

function isMinor(birthDate: string) {
  if (!birthDate) return false;
  const birthday = new Date(birthDate);
  const limit = new Date();
  limit.setFullYear(limit.getFullYear() - 18);
  return birthday > limit;
}

function getAgeOnEvent(birthDate: string) {
  const birth = new Date(birthDate);
  const event = new Date(2026, 10, 7);
  let age = event.getFullYear() - birth.getFullYear();
  const beforeBirthday =
    event.getMonth() < birth.getMonth() ||
    (event.getMonth() === birth.getMonth() && event.getDate() < birth.getDate());
  if (beforeBirthday) age -= 1;
  return age;
}

function getCategory(birthDate: string, gender: string) {
  if (!birthDate) return "";
  const age = getAgeOnEvent(birthDate);
  const band = age < 16 ? "Cadet" : age < 18 ? "Junior" : age < 40 ? "Senior" : "Master";
  if (gender === "Femme") return `${band} Femme`;
  if (gender === "Homme") return `${band} Homme`;
  return band;
}

function isDraftComplete(draft: RunnerDraft) {
  return Boolean(
    draft.firstName.trim() &&
    draft.lastName.trim() &&
    draft.birthDate &&
    draft.gender &&
    draft.race &&
    draft.identityDocument,
  );
}

function draftToRunner(draft: RunnerDraft): Runner {
  return {
    id: Date.now(),
    firstName: draft.firstName.trim(),
    lastName: draft.lastName.trim(),
    birthDate: draft.birthDate,
    gender: draft.gender,
    category: getCategory(draft.birthDate, draft.gender),
    race: draft.race,
    identityDocument: draft.identityDocument,
    medicalCertificate: draft.medicalCertificate,
    parentalAuthorization: isMinor(draft.birthDate) ? draft.parentalAuthorization || undefined : undefined,
  };
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(email);
}

function TrailIcon() {
  return (
    <svg className="highlight-icon" viewBox="0 0 48 48" aria-hidden="true">
      <path d="M4 38 17 18l7 10 5-7 15 17Z" />
      <path d="M13 29h9" />
    </svg>
  );
}

function BikeIcon() {
  return (
    <svg className="highlight-icon" viewBox="0 0 48 48" aria-hidden="true">
      <circle cx="12" cy="33" r="9" />
      <circle cx="36" cy="33" r="9" />
      <path d="M12 33 22 15h7M19 33h17l-9-18M29 12h6" />
    </svg>
  );
}

function BeerIcon() {
  return (
    <svg className="highlight-icon" viewBox="0 0 48 48" aria-hidden="true">
      <path d="M14 9h20l-2 32H16L14 9Z" />
      <path d="M15 19h18" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg className="button-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 3v12" />
      <path d="m7 11 5 5 5-5" />
      <path d="M5 21h14" />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg className="button-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

type Theme = "light" | "dark";

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authenticated, setAuthenticated] = useState(false);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === "undefined") return "light";
    return window.localStorage.getItem("tbb-theme") === "dark" ? "dark" : "light";
  });

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem("tbb-theme", theme);
  }, [theme]);

  function signOut() {
    setAuthenticated(false);
  }

  function toggleTheme() {
    setTheme((current) => (current === "light" ? "dark" : "light"));
  }

  return (
    <div className="public-app">
      <SiteHeader authenticated={authenticated} onSignOut={signOut} />
      <main>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/courses" element={<CoursesPage />} />
          <Route path="/a-propos" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route
            path="/inscription"
            element={
              <AuthPage
                initialTab="register"
                user={user}
                onUserChange={setUser}
                onAuthenticated={() => setAuthenticated(true)}
              />
            }
          />
          <Route
            path="/connexion"
            element={
              <AuthPage
                initialTab="login"
                user={user}
                onUserChange={setUser}
                onAuthenticated={() => setAuthenticated(true)}
              />
            }
          />
          <Route
            path="/espace/*"
            element={
              authenticated && user ? (
                <UserArea
                  user={user}
                  registrations={registrations}
                  onUserChange={setUser}
                  onRegistration={(registration) =>
                    setRegistrations((current) => [registration, ...current])
                  }
                />
              ) : (
                <Navigate to="/connexion" replace />
              )
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <SiteFooter />
      <ThemeSwitcher theme={theme} onToggle={toggleTheme} />
    </div>
  );
}

function ThemeSwitcher({ theme, onToggle }: { theme: Theme; onToggle: () => void }) {
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      className="theme-switcher"
      onClick={onToggle}
      aria-label={isDark ? "Activer le thème clair" : "Activer le thème sombre"}
      title={isDark ? "Thème clair" : "Thème sombre"}
    >
      {isDark ? (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="4.5" />
          <path d="M12 2v2M12 20v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M2 12h2M20 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M21 14.5A8.5 8.5 0 0 1 9.5 3 7.5 7.5 0 1 0 21 14.5Z" />
        </svg>
      )}
    </button>
  );
}

function SiteHeader({
  authenticated,
  onSignOut,
}: {
  authenticated: boolean;
  onSignOut: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="site-header">
      <div className="site-shell header-inner">
        <Link className="brand-link" to="/" aria-label="Accueil TBB" onClick={() => setMenuOpen(false)}>
          <img className="brand-logo" src="/multitrack.svg" alt="MultiTrack" />
          <span className="brand-event">TBB · Trail Bike Beer</span>
        </Link>
        <button
          className="menu-toggle"
          type="button"
          aria-label={menuOpen ? "Fermer le menu" : "Ouvrir le menu"}
          aria-expanded={menuOpen}
          aria-controls="main-navigation"
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span />
          <span />
          <span />
        </button>
        <div className="header-right">
          <nav id="main-navigation" className={`main-nav${menuOpen ? " open" : ""}`} aria-label="Navigation principale">
            <NavLink to="/" end onClick={() => setMenuOpen(false)}>Accueil</NavLink>
            <NavLink to="/courses" onClick={() => setMenuOpen(false)}>Courses</NavLink>
            <NavLink to="/a-propos" onClick={() => setMenuOpen(false)}>À propos</NavLink>
            <NavLink to="/contact" onClick={() => setMenuOpen(false)}>Contact</NavLink>
          </nav>
          {authenticated ? (
            <div className="header-actions">
              <Link className="text-link" to="/espace/inscriptions" onClick={() => setMenuOpen(false)}>Mon espace</Link>
              <button className="button button-ghost button-small" onClick={() => { setMenuOpen(false); onSignOut(); }}>
                Déconnexion
              </button>
            </div>
          ) : (
            <Link className="button button-dark button-small" to="/inscription" onClick={() => setMenuOpen(false)}>
              S’inscrire
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

function HomePage() {
  return (
    <>
      <section className="hero">
        <div className="hero-visual" aria-hidden="true">
          <img className="hero-photo hero-photo-trail" src="/hero-trail.png" alt="" />
          <img className="hero-photo hero-photo-vtt" src="/hero-vtt.png" alt="" />
        </div>
        <div className="site-shell hero-inner">
          <div className="hero-content">
            <h1>L’aventure<br />vous met au défi</h1>
            <p className="hero-copy">
              Rejoignez la communauté pour une expérience inoubliable.
            </p>
            <div className="hero-actions">
              <Link className="button button-dark" to="/inscription">Je participe</Link>
              <Link className="button button-outline" to="/a-propos">En savoir plus</Link>
            </div>
          </div>
        </div>
      </section>
      <section className="section highlights">
        <div className="site-shell">
          <h2>Nos Challenges</h2>
          <div className="highlight-grid">
            {HIGHLIGHTS.map((highlight) => (
              <article className="highlight-card" key={highlight.title}>
                {highlight.icon}
                <div>
                  <h3>{highlight.title}</h3>
                  <p>{highlight.text}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

function CoursesPage() {
  return (
    <Page
      title="Nos challenges"
      intro="Choisissez le défi qui vous correspond."
      compact
    >
      {COURSE_GROUPS.map((group) => (
        <section className="race-group" key={group.title}>
          <h2 className="race-group-title">{group.title}</h2>
          <div className="race-grid">
            {group.races.map((name, index) => {
              const race = RACES.find((item) => item.name === name);
              if (!race) return null;
              return (
                <article className="race-card" key={`${group.title}-${race.name}`}>
                  <div className="race-index">
                    <span className="race-kind">{group.kind}</span>
                    <span className="race-number">0{index + 1}</span>
                  </div>
                  <div>
                    <h3>{race.name}</h3>
                    <p>{race.description}</p>
                  </div>
                  <div className="race-meta">
                    <strong>{race.distance}</strong>
                    <span>{formatAmount(race.price)}{race.duo ? " / duo" : ""}</span>
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

function AboutPage() {
  return (
    <Page
      title="À propos"
      intro="L’aventure TBB, propulsée par MultiTrack."
      compact
      meta={
        <dl className="event-facts">
          <div>
            <dt>Date</dt>
            <dd>Samedi 07 novembre 2026</dd>
          </div>
          <div>
            <dt>Lieu</dt>
            <dd>Ambatomanga</dd>
          </div>
        </dl>
      }
    >
      <div className="content-columns">
        <h2>Plus qu’un événement,<br />une aventure à partager.</h2>
        <div>
          <p>
            TBB — Trail Bike Beer — est un événement sportif conçu pour les
            amateurs d’aventure et toutes celles et ceux qui souhaitent partir
            à la conquête d’un défi, en trail ou en VTT.
          </p>
          <p>
            Aujourd’hui des petits, demain les grands : chaque challenge est
            pensé pour accompagner la progression, du premier dossard au défi
            suprême.
          </p>
          <p>
            En coulisses, MultiTrack simplifie la gestion des événements de
            sport d’endurance : inscriptions, participants, paiements et suivi
            réunis dans un même outil, pour que les organisateurs se concentrent
            sur l’essentiel.
          </p>
        </div>
      </div>
    </Page>
  );
}

function ContactPage() {
  return (
    <Page title="Contact" intro="Une question sur votre participation ?">
      <div className="contact-block">
        <div><span>E-mail</span><a href="mailto:revynatioravelo@gmail.com">revynatioravelo@gmail.com</a></div>
        <div><span>Téléphone</span><a href="tel:+261348893536">+261 34 88 935 36</a></div>
      </div>
    </Page>
  );
}

function Page({
  title,
  intro,
  meta,
  compact,
  children,
}: {
  title: string;
  intro: string;
  meta?: React.ReactNode;
  compact?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className="page-section">
      <div className="site-shell">
        <header className={compact ? "page-heading page-heading-open" : "page-heading"}>
          <p className="eyebrow">TBB · TRAIL BIKE BEER</p>
          <h1>{title}</h1>
          <p>{intro}</p>
          {meta}
        </header>
        {children}
      </div>
    </section>
  );
}

function AuthPage({
  initialTab,
  user,
  onUserChange,
  onAuthenticated,
}: {
  initialTab: "register" | "login";
  user: User | null;
  onUserChange: (user: User) => void;
  onAuthenticated: () => void;
}) {
  const [tab, setTab] = useState(initialTab);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  function submitRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget).entries());
    const email = String(values.email).trim().toLowerCase();
    const password = String(values.password);

    if (!isValidEmail(email)) {
      setError("Saisissez une adresse e-mail valide.");
      return;
    }
    if (password.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }
    if (password !== String(values.passwordConfirmation)) {
      setError("Les deux mots de passe sont différents.");
      return;
    }

    onUserChange({
      firstName: String(values.firstName).trim(),
      lastName: String(values.lastName).trim(),
      email,
      password,
    });
    onAuthenticated();
    navigate("/espace/inscriptions");
  }

  function submitLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget).entries());
    const email = String(values.email).trim().toLowerCase();
    const password = String(values.password);

    if (!isValidEmail(email)) {
      setError("Saisissez une adresse e-mail valide.");
      return;
    }
    if (!user || user.email !== email || user.password !== password) {
      setError("Compte fictif introuvable ou mot de passe incorrect.");
      return;
    }

    onAuthenticated();
    navigate("/espace/inscriptions");
  }

  function changeTab(nextTab: "register" | "login") {
    setTab(nextTab);
    setError("");
  }

  return (
    <section className="auth-page">
      <div className="auth-box">
        <div className="auth-tabs" role="tablist" aria-label="Accès au compte">
          <button className={tab === "register" ? "active" : ""} onClick={() => changeTab("register")}>
            S’inscrire
          </button>
          <button className={tab === "login" ? "active" : ""} onClick={() => changeTab("login")}>
            Se connecter
          </button>
        </div>
        <div className="auth-content">
          <p className="eyebrow">{tab === "register" ? "NOUVEAU COMPTE" : "BON RETOUR"}</p>
          <h1>{tab === "register" ? "Créer mon espace" : "Accéder à mon espace"}</h1>
          <p className="form-intro">
            {tab === "register"
              ? "Les données restent uniquement dans ce prototype et disparaissent au rechargement."
              : "Connectez-vous avec le compte fictif créé pendant cette session."}
          </p>
          {tab === "register" ? (
            <form className="form-grid" onSubmit={submitRegister}>
              <div className="two-columns">
                <Field label="Nom"><input name="lastName" autoComplete="family-name" required /></Field>
                <Field label="Prénom"><input name="firstName" autoComplete="given-name" required /></Field>
              </div>
              <Field label="Adresse e-mail"><input name="email" type="email" autoComplete="email" required /></Field>
              <Field label="Mot de passe"><input name="password" type="password" minLength={8} autoComplete="new-password" required /></Field>
              <Field label="Confirmer le mot de passe"><input name="passwordConfirmation" type="password" minLength={8} autoComplete="new-password" required /></Field>
              {error && <p className="form-error" role="alert">{error}</p>}
              <button className="button button-dark button-full">Créer mon compte</button>
            </form>
          ) : (
            <form className="form-grid" onSubmit={submitLogin}>
              <Field label="Adresse e-mail"><input name="email" type="email" autoComplete="email" required /></Field>
              <Field label="Mot de passe"><input name="password" type="password" autoComplete="current-password" required /></Field>
              {error && <p className="form-error" role="alert">{error}</p>}
              <button className="button button-dark button-full">Se connecter</button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}

function UserArea({
  user,
  registrations,
  onUserChange,
  onRegistration,
}: {
  user: User;
  registrations: Registration[];
  onUserChange: (user: User) => void;
  onRegistration: (registration: Registration) => void;
}) {
  return (
    <section className="account-page">
      <div className="site-shell">
        <header className="account-heading">
          <p className="eyebrow">ESPACE PARTICIPANT</p>
          <h1>Bonjour, {user.firstName}</h1>
        </header>
        <nav className="account-nav" aria-label="Navigation de l’espace participant">
          <NavLink to="/espace/inscriptions">Mes inscriptions</NavLink>
          <NavLink to="/espace/informations">Mes informations</NavLink>
          <NavLink to="/espace/resultats">Mes résultats</NavLink>
        </nav>
        <Routes>
          <Route index element={<Navigate to="inscriptions" replace />} />
          <Route
            path="inscriptions"
            element={<RegistrationsPage registrations={registrations} onRegistration={onRegistration} />}
          />
          <Route path="inscriptions/:registrationId" element={<RegistrationDetailPage registrations={registrations} />} />
          <Route path="informations" element={<ProfilePage user={user} onUserChange={onUserChange} />} />
          <Route path="resultats" element={<ResultsPage />} />
          <Route path="*" element={<Navigate to="inscriptions" replace />} />
        </Routes>
      </div>
    </section>
  );
}

function RegistrationsPage({
  registrations,
  onRegistration,
}: {
  registrations: Registration[];
  onRegistration: (registration: Registration) => void;
}) {
  const [creating, setCreating] = useState(false);

  if (creating) {
    return <RegistrationWizard onCancel={() => setCreating(false)} onValidate={(registration) => {
      onRegistration(registration);
      setCreating(false);
    }} />;
  }

  return (
    <div className="account-content">
      <div className="content-title-row">
        <div>
          <p className="eyebrow">DOSSIERS</p>
          <h2>Mes inscriptions</h2>
          <p className="section-lead">
            Vous pouvez en créer plusieurs, une à la fois. Chaque dossier
            concerne un seul participant.
          </p>
        </div>
        <button className="button button-dark" onClick={() => setCreating(true)}>Nouvelle inscription</button>
      </div>
      <div className="registration-table-wrap">
        <table className="registration-table">
          <thead>
            <tr>
              <th>Inscription</th>
              <th>Date</th>
              <th>Participant</th>
              <th>Course</th>
              <th>Montant</th>
              <th>Statut</th>
              <th><span className="sr-only">Action</span></th>
            </tr>
          </thead>
          <tbody>
            {registrations.length === 0 ? (
              <tr>
                <td colSpan={7} className="empty-table">
                  Aucune inscription pour le moment. Commencez par une nouvelle inscription.
                </td>
              </tr>
            ) : registrations.map((registration) => (
              <tr key={registration.id}>
                <td><strong>{registration.id}</strong></td>
                <td>{registration.createdAt}</td>
                <td>{registration.runner.firstName} {registration.runner.lastName}</td>
                <td>{registration.runner.race}</td>
                <td>{formatAmount(registration.totalAmount)}</td>
                <td><span className="status-pill">{registration.status}</span></td>
                <td><Link className="table-link" to={`/espace/inscriptions/${registration.id}`}>Consulter</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function RegistrationDetailPage({ registrations }: { registrations: Registration[] }) {
  const { registrationId } = useParams();
  const registration = registrations.find((item) => item.id === registrationId);

  if (!registration) {
    return (
      <div className="account-content">
        <Link className="arrow-link" to="/espace/inscriptions">← Retour aux inscriptions</Link>
        <p className="form-message">Cette inscription est introuvable dans cette session fictive.</p>
      </div>
    );
  }

  return (
    <div className="account-content registration-detail">
      <Link className="arrow-link" to="/espace/inscriptions">← Retour aux inscriptions</Link>
      <div className="content-title-row">
        <div>
          <p className="eyebrow">DOSSIER {registration.id}</p>
          <h2>Détail de l’inscription</h2>
        </div>
        <span className="status-pill">{registration.status}</span>
      </div>
      <dl className="registration-metadata">
        <div><dt>Date d’inscription</dt><dd>{registration.createdAt}</dd></div>
        <div><dt>Mode de paiement</dt><dd>{registration.paymentMethod}</dd></div>
        <div><dt>Référence de paiement</dt><dd>{registration.paymentReference}</dd></div>
        <div><dt>Montant</dt><dd>{formatAmount(registration.totalAmount)}</dd></div>
      </dl>
      <h3>Participant</h3>
      <dl className="registration-metadata">
        <div><dt>Nom</dt><dd>{registration.runner.lastName}</dd></div>
        <div><dt>Prénom</dt><dd>{registration.runner.firstName}</dd></div>
        <div><dt>Date de naissance</dt><dd>{new Date(registration.runner.birthDate).toLocaleDateString("fr-FR")}</dd></div>
        <div><dt>Genre</dt><dd>{registration.runner.gender}</dd></div>
        <div><dt>Catégorie</dt><dd>{registration.runner.category}</dd></div>
        <div><dt>Course choisie</dt><dd>{registration.runner.race}</dd></div>
        <div><dt>Pièce d’identité</dt><dd>{registration.runner.identityDocument}</dd></div>
        <div><dt>Certificat médical</dt><dd>{registration.runner.medicalCertificate || "Non fourni"}</dd></div>
        {registration.runner.parentalAuthorization && (
          <div><dt>Autorisation parentale</dt><dd>{registration.runner.parentalAuthorization}</dd></div>
        )}
      </dl>
    </div>
  );
}

function RegistrationWizard({
  onCancel,
  onValidate,
}: {
  onCancel: () => void;
  onValidate: (registration: Registration) => void;
}) {
  const [step, setStep] = useState(1);
  const [rulesAccepted, setRulesAccepted] = useState(false);
  const [draft, setDraft] = useState<RunnerDraft>(EMPTY_DRAFT);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const totalAmount = getRacePrice(draft.race);

  function validate(paymentMethod: Registration["paymentMethod"], paymentReference: string) {
    onValidate({
      id: `TBB-${String(Date.now()).slice(-6)}`,
      createdAt: new Date().toLocaleDateString("fr-FR"),
      status: "Validée",
      paymentReference,
      paymentMethod,
      totalAmount,
      runner: draftToRunner(draft),
    });
  }

  return (
    <div className="wizard">
      <div className="wizard-header">
        <div>
          <p className="eyebrow">NOUVELLE INSCRIPTION</p>
          <h2>Étape {step} sur 3</h2>
        </div>
        <button className="text-button" onClick={onCancel}>Quitter</button>
      </div>
      <ol className="stepper" aria-label="Progression">
        {["Règlement", "Participant", "Résumé"].map((label, index) => (
          <li className={step === index + 1 ? "active" : step > index + 1 ? "done" : ""} key={label}>
            <span>{index + 1}</span>{label}
          </li>
        ))}
      </ol>

      {step === 1 && (
        <section className="wizard-panel">
          <p className="eyebrow">01 — RÈGLEMENT</p>
          <h3>Avant de commencer</h3>
          <p>
            Prenez connaissance du règlement fictif de l’événement avant
            de renseigner le participant.
          </p>
          <div className="document-row">
            <div><strong>Règlement de l’événement</strong><span>Document de démonstration · TXT</span></div>
            <div className="inline-actions">
              <button className="button button-light" onClick={() => alert("Aperçu fictif du règlement TBB.")}>
                Voir <EyeIcon />
              </button>
              <button className="button button-light" onClick={downloadRules}>
                Télécharger <DownloadIcon />
              </button>
            </div>
          </div>
          <Check checked={rulesAccepted} onChange={setRulesAccepted}>
            J’ai lu et j’accepte le règlement de l’événement.
          </Check>
          <WizardActions nextDisabled={!rulesAccepted} onNext={() => setStep(2)} />
        </section>
      )}

      {step === 2 && (
        <RunnerStep
          draft={draft}
          onChange={setDraft}
          onPrevious={() => setStep(1)}
          onNext={() => setStep(3)}
        />
      )}

      {step === 3 && (
        <section className="wizard-panel">
          <p className="eyebrow">03 — RÉSUMÉ</p>
          <h3>Vérifiez votre inscription</h3>
          <p>Contrôlez les informations du participant avant de valider.</p>
          <Summary runner={draftToRunner(draft)} totalAmount={totalAmount} />
          <div className="wizard-actions">
            <button type="button" className="button button-light" onClick={() => setStep(2)}>
              <ArrowLeftIcon /> Retour
            </button>
            <div className="final-actions">
              <button type="button" className="button button-light" onClick={onCancel}>Annuler</button>
              <button type="button" className="button button-dark" onClick={() => setPaymentOpen(true)}>Valider et payer</button>
            </div>
          </div>
        </section>
      )}
      {paymentOpen && (
        <PaymentModal
          totalAmount={totalAmount}
          onClose={() => setPaymentOpen(false)}
          onValidate={validate}
        />
      )}
    </div>
  );
}

function RunnerStep({
  draft,
  onChange,
  onPrevious,
  onNext,
}: {
  draft: RunnerDraft;
  onChange: (draft: RunnerDraft) => void;
  onPrevious: () => void;
  onNext: () => void;
}) {
  const minor = isMinor(draft.birthDate);
  const category = getCategory(draft.birthDate, draft.gender);

  function update<K extends keyof RunnerDraft>(key: K, value: RunnerDraft[K]) {
    onChange({ ...draft, [key]: value });
  }

  return (
    <section className="wizard-panel">
      <p className="eyebrow">02 — PARTICIPANT</p>
      <h3>Renseigner le participant</h3>
      <p className="required-note">Les champs marqués d’un * sont obligatoires.</p>
      <div className="form-grid">
        <div className="two-columns">
          <Field label="Nom *"><input name="lastName" value={draft.lastName} onChange={(event) => update("lastName", event.target.value)} required /></Field>
          <Field label="Prénom *"><input name="firstName" value={draft.firstName} onChange={(event) => update("firstName", event.target.value)} required /></Field>
        </div>
        <div className="two-columns">
          <Field label="Date de naissance *">
            <input name="birthDate" type="date" value={draft.birthDate} onChange={(event) => update("birthDate", event.target.value)} required />
          </Field>
          <Field label="Genre *">
            <select name="gender" value={draft.gender} onChange={(event) => update("gender", event.target.value)} required>
              <option value="" disabled>Choisir</option>
              <option value="Femme">Femme</option>
              <option value="Homme">Homme</option>
              <option value="Non précisé">Non précisé</option>
            </select>
          </Field>
        </div>
        <div className="race-block">
          <div className="two-columns">
            <Field label="Catégorie">
              <span className={category ? "readonly-value" : "readonly-value is-placeholder"}>
                {category || "Déduite de la date de naissance et du genre"}
              </span>
            </Field>
            <Field label="Course choisie *">
              <select name="race" value={draft.race} onChange={(event) => update("race", event.target.value)} required>
                <option value="" disabled>Choisir une course</option>
                {RACES.map((item) => <option key={item.name} value={formatRaceLabel(item)}>{formatRaceLabel(item)}</option>)}
              </select>
            </Field>
          </div>
          {draft.race && (
            <small className="file-hint">
              {formatAmount(getRacePrice(draft.race))}
              {isDuoRace(draft.race)
                ? " — tarif duo. Ce challenge se court à deux : chaque personne crée sa propre inscription."
                : " — un seul participant pour cette inscription."}
            </small>
          )}
        </div>
        <div className="file-grid">
          <Field label="Pièce d’identité (CIN/Carte étudiant) *">
            <input
              name="identityDocument"
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg"
              required={!draft.identityDocument}
              onChange={(event) => update("identityDocument", event.target.files?.[0]?.name ?? "")}
            />
            {draft.identityDocument && <small className="file-hint">Fichier actuel : {draft.identityDocument}</small>}
            <small className="file-hint">Formats acceptés : PDF, PNG, JPG, JPEG.</small>
          </Field>
          <Field label="Certificat médical">
            <input
              name="medicalCertificate"
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg"
              onChange={(event) => update("medicalCertificate", event.target.files?.[0]?.name ?? draft.medicalCertificate)}
            />
            {draft.medicalCertificate && <small className="file-hint">Fichier actuel : {draft.medicalCertificate}</small>}
            <small className="file-hint">Formats acceptés : PDF, PNG, JPG, JPEG.</small>
          </Field>
          {minor && (
            <Field label="Autorisation parentale">
              <input
                name="parentalAuthorization"
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg"
                onChange={(event) => update("parentalAuthorization", event.target.files?.[0]?.name ?? draft.parentalAuthorization)}
              />
              {draft.parentalAuthorization && <small className="file-hint">Fichier actuel : {draft.parentalAuthorization}</small>}
              <small className="file-hint">Formats acceptés : PDF, PNG, JPG, JPEG.</small>
            </Field>
          )}
        </div>
      </div>
      <WizardActions onPrevious={onPrevious} nextDisabled={!isDraftComplete(draft)} onNext={onNext} />
    </section>
  );
}

function Summary({ runner, totalAmount }: { runner: Runner; totalAmount: number }) {
  return (
    <div className="summary">
      <dl className="summary-facts">
        <div><dt>Nom</dt><dd>{runner.lastName}</dd></div>
        <div><dt>Prénom</dt><dd>{runner.firstName}</dd></div>
        <div><dt>Date de naissance</dt><dd>{new Date(runner.birthDate).toLocaleDateString("fr-FR")}</dd></div>
        <div><dt>Genre</dt><dd>{runner.gender}</dd></div>
        <div><dt>Catégorie</dt><dd>{runner.category}</dd></div>
        <div><dt>Course choisie</dt><dd>{runner.race}</dd></div>
      </dl>
      <div className="summary-payment">
        <p className="summary-payment-methods">
          <span>Moyens acceptés sur ce site</span>
          <strong>MVola ou Orange Money</strong>
        </p>
        <p className="summary-payment-amount">
          <span>Montant</span>
          <strong>{formatAmount(totalAmount)}</strong>
        </p>
      </div>
    </div>
  );
}

function PaymentModal({
  totalAmount,
  onClose,
  onValidate,
}: {
  totalAmount: number;
  onClose: () => void;
  onValidate: (method: Registration["paymentMethod"], reference: string) => void;
}) {
  const [method, setMethod] = useState<Registration["paymentMethod"]>("MVola");
  const [reference, setReference] = useState("");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!reference.trim()) return;
    onValidate(method, reference.trim());
  }

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="payment-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="payment-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button className="modal-close" type="button" aria-label="Fermer" onClick={onClose}>×</button>
        <p className="eyebrow">PAIEMENT EN LIGNE · DÉMONSTRATION</p>
        <h3 id="payment-title">Finaliser le paiement</h3>
        <p>Sélectionnez votre opérateur et saisissez la référence reçue après votre paiement.</p>
        <div className="payment-total"><span>Total à payer</span><strong>{formatAmount(totalAmount)}</strong></div>
        <form className="form-grid" onSubmit={submit}>
          <div className="payment-methods" role="radiogroup" aria-label="Mode de paiement">
            {(["MVola", "Orange Money"] as const).map((option) => (
              <label className={method === option ? "payment-method active" : "payment-method"} key={option}>
                <input
                  type="radio"
                  name="paymentMethod"
                  value={option}
                  checked={method === option}
                  onChange={() => setMethod(option)}
                />
                <img
                  src={option === "MVola" ? "/mvola-placeholder.svg" : "/orange-money-placeholder.svg"}
                  alt={`${option} — visuel fictif`}
                />
              </label>
            ))}
          </div>
          <div className="payment-instructions">
            <span>Numéro de paiement</span>
            <strong>{PAYMENT_NUMBER}</strong>
            <small>Informations fictives pour le prototype.</small>
          </div>
          <Field label="Référence de paiement *">
            <input
              name="paymentReference"
              value={reference}
              onChange={(event) => setReference(event.target.value)}
              placeholder="Ex. TBB-123456"
              required
            />
          </Field>
          <button className="button button-dark button-full">Confirmer le paiement</button>
        </form>
      </section>
    </div>
  );
}

function ProfilePage({ user, onUserChange }: { user: User; onUserChange: (user: User) => void }) {
  const [editing, setEditing] = useState(false);
  const [message, setMessage] = useState("");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget).entries());
    const email = String(values.email).trim().toLowerCase();
    const password = String(values.password);
    const confirmation = String(values.passwordConfirmation);

    if (!isValidEmail(email)) {
      setMessage("Saisissez une adresse e-mail valide.");
      return;
    }
    if (password && (password.length < 8 || password !== confirmation)) {
      setMessage("Le nouveau mot de passe doit contenir 8 caractères et les deux saisies doivent correspondre.");
      return;
    }
    onUserChange({
      firstName: String(values.firstName),
      lastName: String(values.lastName),
      email,
      password: password || user.password,
    });
    setMessage("Informations fictives mises à jour.");
    setEditing(false);
  }

  return (
    <div className="account-content profile">
      <div className="content-title-row">
        <div><p className="eyebrow">PROFIL</p><h2>Mes informations</h2></div>
        {!editing && <button className="button button-light" onClick={() => setEditing(true)}>Modifier</button>}
      </div>
      {editing ? (
        <form className="form-grid profile-form" onSubmit={submit}>
          <div className="two-columns">
            <Field label="Nom"><input name="lastName" defaultValue={user.lastName} required /></Field>
            <Field label="Prénom"><input name="firstName" defaultValue={user.firstName} required /></Field>
          </div>
          <Field label="Adresse e-mail"><input name="email" type="email" defaultValue={user.email} required /></Field>
          <Field label="Nouveau mot de passe"><input name="password" type="password" minLength={8} placeholder="Laisser vide pour conserver" /></Field>
          <Field label="Confirmer le nouveau mot de passe"><input name="passwordConfirmation" type="password" minLength={8} /></Field>
          {message && <p className="form-message" role="status">{message}</p>}
          <div className="inline-actions">
            <button className="button button-dark">Enregistrer</button>
            <button type="button" className="button button-light" onClick={() => setEditing(false)}>Annuler</button>
          </div>
      </form>
      ) : (
        <dl className="profile-details">
          <div><dt>Nom</dt><dd>{user.lastName}</dd></div>
          <div><dt>Prénom</dt><dd>{user.firstName}</dd></div>
          <div><dt>Adresse e-mail</dt><dd>{user.email}</dd></div>
          <div><dt>Mot de passe</dt><dd>••••••••••••</dd></div>
        </dl>
      )}
      {!editing && message && <p className="form-message" role="status">{message}</p>}
    </div>
  );
}

function ResultsPage() {
  return (
    <div className="account-content empty-results">
      <p className="eyebrow">RÉSULTATS</p>
      <span className="empty-number">—</span>
      <h2>Les résultats ne sont pas encore disponibles.</h2>
      <p>L’événement n’a pas encore commencé. Revenez ici après les premières courses.</p>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="field"><span>{label}</span>{children}</label>;
}

function Check({
  checked,
  onChange,
  children,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  children: React.ReactNode;
}) {
  return (
    <label className="check-row">
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      <span>{children}</span>
    </label>
  );
}

function ArrowLeftIcon() {
  return (
    <svg className="button-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M19 12H5" />
      <path d="m11 6-6 6 6 6" />
    </svg>
  );
}

function ArrowRightIcon() {
  return (
    <svg className="button-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </svg>
  );
}

function WizardActions({
  onPrevious,
  onNext,
  nextDisabled,
}: {
  onPrevious?: () => void;
  onNext?: () => void;
  nextDisabled?: boolean;
}) {
  if (!onPrevious && !onNext) return null;

  return (
    <div className="wizard-actions">
      {onPrevious ? (
        <button type="button" className="button button-light" onClick={onPrevious}>
          <ArrowLeftIcon /> Retour
        </button>
      ) : <span />}
      {onNext && (
        <button type="button" className="button button-dark" disabled={nextDisabled} onClick={onNext}>
          Continuer <ArrowRightIcon />
        </button>
      )}
    </div>
  );
}

function downloadRules() {
  const content = "RÈGLEMENT TBB — Document fictif de démonstration.";
  const url = URL.createObjectURL(new Blob([content], { type: "text/plain;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = "reglement-multitrack.txt";
  link.click();
  URL.revokeObjectURL(url);
}

function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-shell footer-inner">
        <div className="footer-brand">
          <img className="footer-logo" src="/multitrack.svg" alt="MultiTrack" />
          <span className="footer-tagline">Plus loin ensemble</span>
        </div>
        <p>© 2026 MultiTrack</p>
        <span>Powered by Vahira</span>
      </div>
    </footer>
  );
}

export default App;
