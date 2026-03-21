import { Suspense, lazy, useCallback, useEffect, useId, useState } from "react";
import { Helmet, HelmetProvider } from "react-helmet";
import { Route, Routes, useLocation, useNavigate } from "react-router";

import { AppPage } from "@web-speed-hackathon-2026/client/src/components/application/AppPage";
import { AuthModalContainer } from "@web-speed-hackathon-2026/client/src/containers/AuthModalContainer";
import { DirectMessageContainer } from "@web-speed-hackathon-2026/client/src/containers/DirectMessageContainer";
import { DirectMessageListContainer } from "@web-speed-hackathon-2026/client/src/containers/DirectMessageListContainer";
import { NotFoundContainer } from "@web-speed-hackathon-2026/client/src/containers/NotFoundContainer";
import { PostContainer } from "@web-speed-hackathon-2026/client/src/containers/PostContainer";
import { SearchContainer } from "@web-speed-hackathon-2026/client/src/containers/SearchContainer";
import { TermContainer } from "@web-speed-hackathon-2026/client/src/containers/TermContainer";
import { TimelineContainer } from "@web-speed-hackathon-2026/client/src/containers/TimelineContainer";
import { UserProfileContainer } from "@web-speed-hackathon-2026/client/src/containers/UserProfileContainer";
import { formatDateJa, toIsoString } from "@web-speed-hackathon-2026/client/src/utils/date_time";
import { fetchJSON, sendJSON } from "@web-speed-hackathon-2026/client/src/utils/fetchers";
import { getProfileImagePath } from "@web-speed-hackathon-2026/client/src/utils/get_path";

const CrokContainer = lazy(() =>
  import("@web-speed-hackathon-2026/client/src/containers/CrokContainer").then((module) => ({
    default: module.CrokContainer,
  })),
);
const NewPostModalContainer = lazy(() =>
  import("@web-speed-hackathon-2026/client/src/containers/NewPostModalContainer").then(
    (module) => ({
      default: module.NewPostModalContainer,
    }),
  ),
);

const InitialTimelineShell = ({ timeline }: { timeline: Models.Post[] }) => {
  return (
    <main className="mx-auto max-w-2xl px-4 py-6">
      <h1 className="text-cax-text text-2xl font-bold">CaX</h1>
      <section className="mt-4">
        {timeline.map((post) => {
          const username = post.user.username ?? "";
          const userDisplayName = post.user.name.trim() || "ユーザー";
          const profileImageAlt = post.user.profileImage.alt ?? `${userDisplayName}のプロフィール画像`;
          const profileImageSrc = post.user.profileImage.id
            ? getProfileImagePath(post.user.profileImage.id)
            : getProfileImagePath("default");
          const userPath = `/users/${encodeURIComponent(username)}`;

          return (
            <article className="hover:bg-cax-surface-subtle px-1 sm:px-4" key={post.id}>
              <div className="border-cax-border flex border-b px-2 pt-2 pb-4 sm:px-4">
                <div className="shrink-0 grow-0 pr-2 sm:pr-4">
                  <a
                    className="border-cax-border bg-cax-surface-subtle block h-12 w-12 overflow-hidden rounded-full border hover:opacity-75 sm:h-16 sm:w-16"
                    href={userPath}
                  >
                    <img
                      alt={profileImageAlt}
                      className="h-full w-full object-cover"
                      decoding="async"
                      loading="lazy"
                      src={profileImageSrc}
                    />
                  </a>
                </div>
                <div className="min-w-0 shrink grow">
                  <p className="overflow-hidden text-sm text-ellipsis whitespace-nowrap">
                    <a className="text-cax-text pr-1 font-bold hover:underline" href={userPath}>
                      {userDisplayName}
                    </a>
                    <a className="text-cax-text-muted pr-1 hover:underline" href={userPath}>
                      @{username}
                    </a>
                    <span className="text-cax-text-muted pr-1">-</span>
                    <a className="text-cax-text-muted pr-1 hover:underline" href={`/posts/${post.id}`}>
                      <time dateTime={toIsoString(post.createdAt)}>{formatDateJa(post.createdAt)}</time>
                    </a>
                  </p>
                  <div className="text-cax-text leading-relaxed">{post.text}</div>
                </div>
              </div>
            </article>
          );
        })}
      </section>
    </main>
  );
};

export const AppContainer = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  const [activeUser, setActiveUser] = useState<Models.User | null>(null);
  const [isLoadingActiveUser, setIsLoadingActiveUser] = useState(true);
  useEffect(() => {
    void fetchJSON<Models.User>("/api/v1/me")
      .then((user) => {
        setActiveUser(user);
      })
      .finally(() => {
        setIsLoadingActiveUser(false);
      });
  }, [setActiveUser, setIsLoadingActiveUser]);
  const handleLogout = useCallback(async () => {
    await sendJSON("/api/v1/signout", {});
    setActiveUser(null);
    navigate("/");
  }, [navigate]);

  const authModalId = useId();
  const newPostModalId = useId();

  if (isLoadingActiveUser) {
    const initialTimeline = pathname === "/" ? window.__INITIAL_TIMELINE_POSTS__ : undefined;
    return (
      <HelmetProvider>
        <Helmet>
          <title>{pathname === "/" ? "CaX" : "読込中 - CaX"}</title>
        </Helmet>
        {pathname === "/" && Array.isArray(initialTimeline) ? (
          <InitialTimelineShell timeline={initialTimeline} />
        ) : (
          <main className="mx-auto max-w-2xl px-4 py-6">
            <h1 className="text-cax-text text-2xl font-bold">{pathname.startsWith("/crok") ? "Crok" : "CaX"}</h1>
            <p className="text-cax-text-muted mt-2 text-sm">Loading...</p>
          </main>
        )}
      </HelmetProvider>
    );
  }

  return (
    <HelmetProvider>
      <AppPage
        activeUser={activeUser}
        authModalId={authModalId}
        newPostModalId={newPostModalId}
        onLogout={handleLogout}
      >
        <Routes>
          <Route element={<TimelineContainer />} path="/" />
          <Route
            element={
              <DirectMessageListContainer activeUser={activeUser} authModalId={authModalId} />
            }
            path="/dm"
          />
          <Route
            element={<DirectMessageContainer activeUser={activeUser} authModalId={authModalId} />}
            path="/dm/:conversationId"
          />
          <Route element={<SearchContainer />} path="/search" />
          <Route element={<UserProfileContainer />} path="/users/:username" />
          <Route element={<PostContainer />} path="/posts/:postId" />
          <Route element={<TermContainer />} path="/terms" />
          <Route
            element={
              <Suspense fallback={null}>
                <CrokContainer activeUser={activeUser} authModalId={authModalId} />
              </Suspense>
            }
            path="/crok"
          />
          <Route element={<NotFoundContainer />} path="*" />
        </Routes>
      </AppPage>

      <AuthModalContainer id={authModalId} onUpdateActiveUser={setActiveUser} />
      {activeUser !== null ? (
        <Suspense fallback={null}>
          <NewPostModalContainer id={newPostModalId} />
        </Suspense>
      ) : null}
    </HelmetProvider>
  );
};
