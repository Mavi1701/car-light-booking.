import React, { useEffect, useState } from 'react';

type User = { username: string; password: string; isAdmin?: boolean };
type Booking = {
  id: string;
  owner?: string; // username of the person who made the booking (or 'guest')
  name: string;
  phone: string;
  car?: string;
  date?: string; // ISO date string
  status: 'pending' | 'booked' | 'cancelled';
  note?: string;
};

export default function CarLightsShowcase(): JSX.Element {
  const images: string[] = [
    'https://i.ytimg.com/vi/tRf0z_WMFmw/maxresdefault.jpg',
    'https://images.unsplash.com/photo-1603723609832-4e55f2f90c34?q=80&w=1400&auto=format&fit=crop',
    'https://i.ytimg.com/vi/YII9aMrYcrQ/maxresdefault.jpg',
    'https://images.unsplash.com/photo-1600028065158-4cf9f2a444ef?q=80&w=1400&auto=format&fit=crop'
  ];

  // Slideshow
  const [currentIndex, setCurrentIndex] = useState<number>(0);

  // App data
  const [users, setUsers] = useState<User[]>([{ username: 'Rutik', password: 'Rutik1701@', isAdmin: true }]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [user, setUser] = useState<string | null>(null); // current logged-in username

  // UI state
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [bookingSubmitted, setBookingSubmitted] = useState(false);
  const [bookingData, setBookingData] = useState<Booking | null>(null);

  // Admin edit
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);

  // Load persisted state and ensure admin exists
  useEffect(() => {
    try {
      const rawUsers = localStorage.getItem('cl_users');
      const storedUsers: User[] = rawUsers ? JSON.parse(rawUsers) : [];

      // ensure Rutik exists
      if (!storedUsers.some((u) => u.username === 'Rutik')) {
        storedUsers.push({ username: 'Rutik', password: 'Rutik1701@', isAdmin: true });
      }

      setUsers(storedUsers);
      localStorage.setItem('cl_users', JSON.stringify(storedUsers));

      const rawBookings = localStorage.getItem('cl_bookings');
      if (rawBookings) {
        const parsed: Booking[] = JSON.parse(rawBookings);
        setBookings(parsed);
      }

      const rawUser = localStorage.getItem('cl_user');
      if (rawUser) setUser(rawUser);
    } catch (err) {
      console.error('Error loading localStorage', err);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist bookings & users
  useEffect(() => {
    localStorage.setItem('cl_bookings', JSON.stringify(bookings));
  }, [bookings]);

  useEffect(() => {
    localStorage.setItem('cl_users', JSON.stringify(users));
  }, [users]);

  // slideshow interval
  useEffect(() => {
    const id = setInterval(() => setCurrentIndex((i) => (i + 1) % images.length), 4500);
    return () => clearInterval(id);
  }, [images.length]);

  // helpers
  const makeId = () => `${Date.now()}${Math.floor(Math.random() * 1000)}`;

  // --- Auth ---
  const handleLogin = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget as HTMLFormElement;
    const fd = new FormData(form);
    const username = String(fd.get('username') || '').trim();
    const password = String(fd.get('password') || '');
    const found = users.find((u) => u.username === username && u.password === password);
    if (found) {
      setUser(username);
      localStorage.setItem('cl_user', username);
      setShowLogin(false);
      setShowRegister(false);
    } else {
      alert('Invalid credentials');
    }
  };

  const handleRegister = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget as HTMLFormElement;
    const fd = new FormData(form);
    const username = String(fd.get('username') || '').trim();
    const password = String(fd.get('password') || '');
    if (!username) return alert('Enter a username');
    if (users.some((u) => u.username === username)) return alert('Username already exists');
    const newUser: User = { username, password, isAdmin: false };
    setUsers((prev) => [...prev, newUser]);
    alert('Account created — please log in');
    setShowRegister(false);
    setShowLogin(true);
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('cl_user');
  };

  const loggedUser = users.find((u) => u.username === user);
  const isAdmin = !!loggedUser?.isAdmin;

  // --- Booking actions ---
  const handleBookingSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget as HTMLFormElement;
    const fd = new FormData(form);
    const booking: Booking = {
      id: makeId(),
      owner: user || 'guest',
      name: String(fd.get('name') || ''),
      phone: String(fd.get('phone') || ''),
      car: String(fd.get('car') || ''),
      date: String(fd.get('date') || ''),
      status: 'pending',
      note: String(fd.get('note') || '')
    };
    setBookings((prev) => [...prev, booking]);
    setBookingData(booking);
    setBookingSubmitted(true);
  };

  const userCancelBooking = (id: string) => {
    setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, status: 'cancelled' } : b)));
  };

  // Admin controls
  const adminConfirm = (id: string) => {
    setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, status: 'booked' } : b)));
  };

  const adminCancel = (id: string) => {
    setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, status: 'cancelled' } : b)));
  };

  const adminDelete = (id: string) => {
    if (!confirm('Delete this booking?')) return;
    setBookings((prev) => prev.filter((b) => b.id !== id));
  };

  const adminOpenEdit = (booking: Booking) => {
    setEditingBooking(booking);
  };

  const adminSaveEdit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingBooking) return;
    const fd = new FormData(e.currentTarget as HTMLFormElement);
    const updated: Booking = {
      ...editingBooking,
      owner: String(fd.get('owner') || editingBooking.owner || 'guest'),
      name: String(fd.get('name') || editingBooking.name),
      phone: String(fd.get('phone') || editingBooking.phone),
      car: String(fd.get('car') || editingBooking.car),
      date: String(fd.get('date') || editingBooking.date),
      status: (String(fd.get('status')) as Booking['status']) || editingBooking.status,
      note: String(fd.get('note') || editingBooking.note || '')
    };
    setBookings((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
    setEditingBooking(null);
  };

  // Utility: bookings for current user
  const myBookings = user ? bookings.filter((b) => b.owner === user) : [];

  // --- Views ---
  // 1) Login
  if (showLogin && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-black to-blue-900 text-gray-100">
        <form onSubmit={handleLogin} className="bg-black/60 p-8 rounded-xl shadow-xl w-full max-w-sm">
          <h2 className="text-2xl font-bold text-cyan-400 mb-4">Login</h2>
          <input name="username" placeholder="Username" className="block w-full mb-3 rounded-md bg-black/70 border border-white/10 px-3 py-2 text-white text-sm" required />
          <input name="password" type="password" placeholder="Password" className="block w-full mb-3 rounded-md bg-black/70 border border-white/10 px-3 py-2 text-white text-sm" required />
          <button type="submit" className="w-full bg-fuchsia-500 hover:bg-fuchsia-600 px-4 py-2 rounded-md">Login</button>
          <button type="button" onClick={() => { setShowLogin(false); setShowRegister(true); }} className="w-full mt-3 text-sm text-gray-400">Create Account</button>
          <button type="button" onClick={() => setShowLogin(false)} className="w-full mt-3 text-sm text-gray-400">Back to Home</button>
        </form>
      </div>
    );
  }

  // 2) Register
  if (showRegister) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-black to-blue-900 text-gray-100">
        <form onSubmit={handleRegister} className="bg-black/60 p-8 rounded-xl shadow-xl w-full max-w-sm">
          <h2 className="text-2xl font-bold text-cyan-400 mb-4">Create Account</h2>
          <input name="username" placeholder="Choose a username" className="block w-full mb-3 rounded-md bg-black/70 border border-white/10 px-3 py-2 text-white text-sm" required />
          <input name="password" type="password" placeholder="Choose a password" className="block w-full mb-3 rounded-md bg-black/70 border border-white/10 px-3 py-2 text-white text-sm" required />
          <button type="submit" className="w-full bg-cyan-500 hover:bg-cyan-600 px-4 py-2 rounded-md">Register</button>
          <button type="button" onClick={() => { setShowRegister(false); setShowLogin(true); }} className="w-full mt-3 text-sm text-gray-400">Back to Login</button>
        </form>
      </div>
    );
  }

  // 3) Admin dashboard
  if (isAdmin && user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-blue-900 text-gray-100 antialiased p-8">
        <div className="max-w-5xl mx-auto bg-black/50 p-6 rounded-2xl shadow-lg">
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-bold text-cyan-400">Admin Dashboard</h2>
            <div className="flex items-center gap-3">
              <div className="text-gray-300">Logged in as <strong className="text-fuchsia-300">{user}</strong></div>
              <button onClick={handleLogout} className="bg-fuchsia-500 hover:bg-fuchsia-600 px-3 py-2 rounded-md">Logout</button>
            </div>
          </div>

          <h3 className="text-lg text-fuchsia-400 mt-6">Bookings</h3>

          {bookings.length === 0 ? (
            <p className="text-gray-400 mt-4">No bookings yet.</p>
          ) : (
            <ul className="mt-4 space-y-4">
              {bookings.map((b) => (
                <li key={b.id} className="p-4 rounded-lg bg-black/60 border border-white/10">
                  <div className="flex items-start justify-between">
                    <div>
                      <p><strong>Name:</strong> {b.name} {b.owner && <span className="text-xs text-gray-400">(owner: {b.owner})</span>}</p>
                      <p><strong>Phone:</strong> {b.phone}</p>
                      <p><strong>Car:</strong> {b.car}</p>
                      <p><strong>Date:</strong> {b.date || '—'}</p>
                      <p><strong>Status:</strong> <span className={`px-2 py-1 rounded text-sm ${b.status === 'booked' ? 'bg-green-600' : b.status === 'cancelled' ? 'bg-red-600' : 'bg-yellow-600'}`}>{b.status}</span></p>
                      {b.note && <p className="text-sm text-gray-300 mt-1">Note: {b.note}</p>}
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <div className="flex gap-2">
                        <button onClick={() => adminConfirm(b.id)} className="bg-green-600 hover:bg-green-700 px-3 py-1 rounded-md text-sm">Confirm</button>
                        <button onClick={() => adminCancel(b.id)} className="bg-yellow-600 hover:bg-yellow-700 px-3 py-1 rounded-md text-sm">Cancel</button>
                        <button onClick={() => adminDelete(b.id)} className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded-md text-sm">Delete</button>
                      </div>
                      <button onClick={() => adminOpenEdit(b)} className="text-sm underline text-gray-300">Edit</button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {/* Edit modal (simple inline panel) */}
          {editingBooking && (
            <div className="mt-6 bg-black/40 p-4 rounded">
              <h4 className="font-semibold text-lg text-cyan-300">Edit Booking</h4>
              <form onSubmit={adminSaveEdit} className="mt-3 grid grid-cols-1 gap-2">
                <input name="owner" defaultValue={editingBooking.owner} placeholder="owner username" className="px-3 py-2 rounded bg-black/70 border border-white/10 text-white text-sm" />
                <input name="name" defaultValue={editingBooking.name} placeholder="name" className="px-3 py-2 rounded bg-black/70 border border-white/10 text-white text-sm" />
                <input name="phone" defaultValue={editingBooking.phone} placeholder="phone" className="px-3 py-2 rounded bg-black/70 border border-white/10 text-white text-sm" />
                <input name="car" defaultValue={editingBooking.car} placeholder="car model" className="px-3 py-2 rounded bg-black/70 border border-white/10 text-white text-sm" />
                <input name="date" type="date" defaultValue={editingBooking.date} className="px-3 py-2 rounded bg-black/70 border border-white/10 text-white text-sm" />
                <select name="status" defaultValue={editingBooking.status} className="px-3 py-2 rounded bg-black/70 border border-white/10 text-white text-sm">
                  <option value="pending">pending</option>
                  <option value="booked">booked</option>
                  <option value="cancelled">cancelled</option>
                </select>
                <textarea name="note" defaultValue={editingBooking.note} placeholder="note" className="px-3 py-2 rounded bg-black/70 border border-white/10 text-white text-sm" />
                <div className="flex gap-2">
                  <button type="submit" className="bg-cyan-500 px-3 py-2 rounded">Save</button>
                  <button type="button" onClick={() => setEditingBooking(null)} className="bg-gray-600 px-3 py-2 rounded">Cancel</button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    );
  }

  // 4) Booking confirmation page for users (after they submit)
  if (bookingSubmitted && bookingData) {
    // show updated status by looking up in current bookings (in case admin changed it immediately)
    const current = bookings.find((b) => b.id === bookingData.id) || bookingData;
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-blue-900 text-gray-100 antialiased flex items-center justify-center">
        <div className="bg-black/50 p-10 rounded-2xl shadow-2xl max-w-lg w-full text-center">
          <h2 className="text-3xl font-bold text-cyan-400">Booking Received</h2>
          <p className="mt-4 text-gray-300">Thanks, <span className="text-fuchsia-400">{current.name}</span>. Your request is recorded.</p>
          <div className="mt-6 space-y-2 text-sm text-gray-400">
            <p><strong>Phone:</strong> {current.phone}</p>
            <p><strong>Car:</strong> {current.car}</p>
            <p><strong>Date:</strong> {current.date || '—'}</p>
            <p><strong>Status:</strong> <span className={`px-2 py-1 rounded ${current.status === 'booked' ? 'bg-green-600' : current.status === 'cancelled' ? 'bg-red-600' : 'bg-yellow-600'}`}>{current.status}</span></p>
            {current.note && <p className="text-sm">Note: {current.note}</p>}
          </div>

          <div className="mt-6 flex justify-center gap-3">
            <button onClick={handleBackToHome} className="bg-fuchsia-500 hover:bg-fuchsia-600 px-5 py-2 rounded-md">Back to Home</button>
            {user && current.owner === user && current.status !== 'cancelled' && (
              <button onClick={() => { userCancelBooking(current.id); alert('Booking cancelled'); handleBackToHome(); }} className="bg-yellow-500 hover:bg-yellow-600 px-5 py-2 rounded-md">Cancel My Booking</button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // 5) Main public site
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-blue-900 text-gray-100 antialiased">
      {/* Header */}
      <header className="fixed w-full z-30 bg-gradient-to-b from-black/80 to-transparent">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-md bg-gradient-to-br from-fuchsia-500 to-cyan-500 flex items-center justify-center font-bold shadow-lg">ST</div>
            <div>
              <h1 className="text-lg font-semibold tracking-tight">StreetsTunes</h1>
              <p className="text-xs text-gray-400">Custom interior lighting & installs</p>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-sm">
            <a href="#what" className="hover:text-white">What we do</a>
            <a href="#gallery" className="hover:text-white">Gallery</a>
            <a href="#testimonials" className="hover:text-white">Testimonials</a>
            <a href="#book" className="hover:text-white">Book Appointment</a>

            {!user ? (
              <button onClick={() => setShowLogin(true)} className="bg-cyan-500 hover:bg-cyan-600 px-4 py-2 rounded-md text-sm">Login</button>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-gray-300 text-sm">Hi, {user}</span>
                <button onClick={handleLogout} className="bg-fuchsia-500 hover:bg-fuchsia-600 px-3 py-1 rounded-md text-sm">Logout</button>
              </div>
            )}
          </nav>

          <div className="md:hidden text-sm flex gap-2">
            <a href="#book" className="bg-fuchsia-500 hover:bg-fuchsia-600 px-3 py-2 rounded-md">Book</a>
            {!user ? (
              <button onClick={() => setShowLogin(true)} className="bg-cyan-500 hover:bg-cyan-600 px-3 py-2 rounded-md">Login</button>
            ) : (
              <button onClick={handleLogout} className="bg-fuchsia-500 hover:bg-fuchsia-600 px-3 py-2 rounded-md">Logout</button>
            )}
          </div>
        </div>
      </header>

      {/* Hero Slideshow */}
      <section className="pt-24">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center gap-10">
          <div className="md:w-6/12">
            <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight leading-tight text-cyan-400">Transform Your Ride with Custom Interior Lighting</h2>
            <p className="mt-4 text-gray-300">We design and install immersive ambient lighting systems tailored to your car — from subtle accent glows to full RGB experiences. Browse our work and book an appointment for a consultation and install.</p>
            <div className="mt-6 flex gap-4">
              <a href="#gallery" className="inline-block border border-fuchsia-500 text-fuchsia-400 px-5 py-3 rounded-md">See Our Work</a>
              <a href="#book" className="inline-block bg-cyan-500 text-white px-5 py-3 rounded-md shadow-lg">Book Appointment</a>
            </div>
          </div>

          <div className="md:w-6/12 relative">
            <div className="rounded-2xl overflow-hidden shadow-2xl border border-white/10 relative h-80">
              <img src={images[currentIndex]} alt="Car interior lighting" className="w-full h-80 object-cover" />
            </div>
            <div className="mt-3 text-xs text-gray-400">Slideshow of recent installations.</div>
          </div>
        </div>
      </section>

      {/* What We Do */}
      <section id="what" className="mt-20">
        <div className="max-w-6xl mx-auto px-6">
          <h3 className="text-2xl font-bold text-fuchsia-400">What We Do</h3>
          <p className="text-gray-300 mt-2 max-w-2xl">We specialise in premium interior lighting solutions for cars: ambient strips, starlight roofs, footwell lights, door edge accents, and fully custom RGB systems with app control.</p>
          <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="p-6 bg-black/40 rounded-xl">
              <h4 className="font-semibold text-cyan-300">Ambient Strip Kits</h4>
              <p className="text-gray-300 mt-2 text-sm">Subtle to bright strips that accent your cabin.</p>
            </div>
            <div className="p-6 bg-black/40 rounded-xl">
              <h4 className="font-semibold text-cyan-300">Starlight Roof</h4>
              <p className="text-gray-300 mt-2 text-sm">Fiber-optic starlight headliners for a luxury look.</p>
            </div>
            <div className="p-6 bg-black/40 rounded-xl">
              <h4 className="font-semibold text-cyan-300">Footwell & Door Glow</h4>
              <p className="text-gray-300 mt-2 text-sm">Custom mapped lighting zones.</p>
            </div>
            <div className="p-6 bg-black/40 rounded-xl">
              <h4 className="font-semibold text-cyan-300">Custom RGB Profiles</h4>
              <p className="text-gray-300 mt-2 text-sm">App-controlled scenes and animations.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Gallery */}
      <section id="gallery" className="mt-20">
        <div className="max-w-6xl mx-auto px-6">
          <h3 className="text-2xl font-bold text-fuchsia-400">Gallery — Our Installs</h3>
          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <img key={i} src={`https://images.unsplash.com/photo-1600028065158-4cf9f2a444ef?q=80&w=800&auto=format&fit=crop`} className="w-full h-40 object-cover rounded-lg shadow-lg" alt={`gallery-${i}`} />
            ))}
          </div>
        </div>
      </section>

      {/* Booking */}
      <section id="book" className="mt-20 pb-20">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h3 className="text-2xl font-bold text-cyan-400">Book an Appointment</h3>
            <form onSubmit={handleBookingSubmit} className="mt-6 space-y-4 bg-black/50 p-6 rounded-lg shadow-lg">
              <input name="name" type="text" placeholder="Your name" className="block w-full rounded-md bg-black/70 border border-white/10 px-3 py-2 text-white text-sm" required />
              <input name="phone" type="text" placeholder="Phone or WhatsApp" className="block w-full rounded-md bg-black/70 border border-white/10 px-3 py-2 text-white text-sm" required />
              <input name="car" type="text" placeholder="Car model & notes" className="block w-full rounded-md bg-black/70 border border-white/10 px-3 py-2 text-white text-sm" />
              <input name="date" type="date" className="block w-full rounded-md bg-black/70 border border-white/10 px-3 py-2 text-white text-sm" />
              <textarea name="note" placeholder="Optional note" className="block w-full rounded-md bg-black/70 border border-white/10 px-3 py-2 text-white text-sm" />
              <div className="flex gap-3">
                <button type="submit" className="bg-fuchsia-500 hover:bg-fuchsia-600 px-4 py-2 rounded-md">Request Booking</button>
                {user && (
                  <button type="button" onClick={() => { window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }); }} className="px-4 py-2 rounded-md border border-white/10">My Bookings</button>
                )}
              </div>
            </form>
          </div>

          <div>
            <h4 className="text-lg font-semibold text-fuchsia-400">Visit Our Workshop</h4>
            <p className="text-gray-300 mt-1">Address line 1<br />City — Postcode</p>
            <img src="https://images.unsplash.com/photo-1605514681473-37bb5a21c91d?q=80&w=1400&auto=format&fit=crop" alt="map placeholder" className="w-full h-64 object-cover rounded-lg mt-4 shadow-lg" />

            {/* My Bookings (if logged in) */}
            {user && (
              <div className="mt-6 bg-black/40 p-4 rounded-lg">
                <h5 className="font-semibold text-sm text-cyan-300">My Bookings</h5>
                {myBookings.length === 0 ? (
                  <p className="text-sm text-gray-400 mt-2">You have no bookings yet.</p>
                ) : (
                  <ul className="mt-2 space-y-2 text-sm text-gray-200">
                    {myBookings.map((b) => (
                      <li key={b.id} className="p-3 bg-black/60 rounded">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-semibold">{b.name}</div>
                            <div className="text-xs text-gray-400">{b.car || '—'} · {b.date || 'no date'}</div>
                            <div className="text-xs mt-1"><span className={`px-2 py-1 rounded ${b.status === 'booked' ? 'bg-green-600' : b.status === 'cancelled' ? 'bg-red-600' : 'bg-yellow-600'}`}>{b.status}</span></div>
                          </div>
                          <div className="flex flex-col gap-2">
                            {b.status !== 'cancelled' && (
                              <button onClick={() => { userCancelBooking(b.id); alert('Your booking has been cancelled'); }} className="bg-yellow-500 hover:bg-yellow-600 px-3 py-1 rounded text-xs">Cancel</button>
                            )}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8 mt-12">
        <div className="max-w-6xl mx-auto px-6 text-center text-sm text-gray-400">© {new Date().getFullYear()} StreetsTunes — Custom interior lighting.</div>
      </footer>
    </div>
  );
}
