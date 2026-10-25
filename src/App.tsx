import { RouterProvider, useRouter } from '@/lib/router';
import { Layout } from '@/components/Layout';
import { OverviewPage } from '@/pages/OverviewPage';
import { InvestigationsListPage } from '@/pages/InvestigationsListPage';
import { NewInvestigationPage } from '@/pages/NewInvestigationPage';
import { InvestigationWorkspace } from '@/pages/InvestigationWorkspace';
import { HowItWorksPage } from '@/pages/HowItWorksPage';
import { NotFoundPage } from '@/pages/NotFoundPage';

function Routes() {
  const { path } = useRouter();

  let page;
  if (path === '/') {
    page = <OverviewPage />;
  } else if (path === '/investigations') {
    page = <InvestigationsListPage />;
  } else if (path === '/incidents/new') {
    page = <NewInvestigationPage />;
  } else if (path.startsWith('/incidents/')) {
    const id = path.replace('/incidents/', '');
    page = <InvestigationWorkspace id={id} />;
  } else if (path === '/how-it-works') {
    page = <HowItWorksPage />;
  } else {
    page = <NotFoundPage />;
  }

  return <Layout>{page}</Layout>;
}

function App() {
  return (
    <RouterProvider>
      <Routes />
    </RouterProvider>
  );
}

export default App;
