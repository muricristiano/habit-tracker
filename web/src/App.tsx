import { Habit } from './components/Habit';

function App() {
  return (
    <div>
      <Habit completed={3} />
      <Habit completed={10} />
      <Habit completed={4} />
      <Habit completed={6} />
      <Habit completed={2} />
      <Habit completed={1} />
      <Habit completed={14} />
    </div>
  )
}

export default App
