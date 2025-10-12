import { Disclosure } from "@headlessui/react";
import { Bars3Icon, BellIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { Link } from "react-router-dom";

function Navbar() {
  return (
    <Disclosure as="nav" className="my-5 z-50">
      {({ open }: { open: boolean }) => (
        <>
          <div className="mx-auto max-w-7xl px-2 sm:px-6 lg:px-8">
            <div className="relative flex h-16 items-center justify-between">
              <div className="absolute inset-y-0 left-0 flex items-center sm:hidden">
                <Disclosure.Button className="rounded-l bg-slate-400 p-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                    className="h-6 w-6 dark:text-slate-900 text-slate-100"
                  >
                    <path
                      fillRule="evenodd"
                      d="M2 4.75A.75.75 0 012.75 4h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 4.75zM2 10a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 10zm0 5.25a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75a.75.75 0 01-.75-.75z"
                      clipRule="evenodd"
                    ></path>
                  </svg>
                </Disclosure.Button>
              </div>

              <div className="flex flex-1 items-center justify-center sm:items-stretch sm:justify-start">
                <div className="flex flex-shrink-0 items-center">
                  <span className="md:block text-slate-100 dark:text-slate-100 font-bold lg:text-2xl">
                    <Link to={"/"}>LMDB</Link>
                  </span>
                </div>
                <div className="hidden  sm:ml-6 sm:block">
                  <ul className="hidden  md:flex space-x-4 dark:text-slate-100 text-slate-900">
                    <li className="px-4 py-2">
                      <div className="group inline-block relative">
                        <button className="bg-gray-300 text-gray-700 font-semibold py-2 px-4 rounded inline-flex items-center">
                          <span className="mr-1">Filmler</span>
                          <svg
                            className="fill-current h-4 w-4"
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                          </svg>
                        </button>

                        <ul className="absolute hidden  text-gray-700 min-w-max pt-1 group-hover:block">
                          <li className="hover:cursor-pointer">
                            <Link
                              className="rounded-t bg-gray-200 hover:bg-gray-400 py-2 px-4 block whitespace-no-wrap"
                              to={"/movie"}
                            >
                              Popüler
                            </Link>
                          </li>
                          <li className="hover:cursor-pointer">
                            <Link
                              className="bg-gray-200 hover:bg-gray-400 py-2 px-4 block whitespace-no-wrap"
                              to={"/movie/now-playing"}
                            >
                              Gösterimdekiler
                            </Link>
                          </li>
                          <li className="hover:cursor-pointer">
                            <Link
                              className="rounded-b bg-gray-200 hover:bg-gray-400 py-2 px-4 block whitespace-no-wrap"
                              to={"/movie/upcoming"}
                            >
                              Yakında
                            </Link>
                          </li>
                        </ul>
                      </div>
                    </li>

                    <li className="px-4 py-2 hover:cursor-pointer">
                      <div className="group inline-block relative">
                        <button className="bg-gray-300 text-gray-700 font-semibold py-2 px-4 rounded inline-flex items-center">
                          <span className="mr-1">Diziler</span>
                          <svg
                            className="fill-current h-4 w-4"
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                          </svg>
                        </button>

                        <ul className="absolute hidden text-gray-700 min-w-max pt-1 group-hover:block">
                          <li className="hover:cursor-pointer">
                            <Link
                              className="rounded-t bg-gray-200 hover:bg-gray-400 py-2 px-4 block whitespace-no-wrap"
                              to={"/tv"}
                            >
                              Popüler
                            </Link>
                          </li>
                          <li className="hover:cursor-pointer">
                            <Link
                              className="bg-gray-200 hover:bg-gray-400 py-2 px-4 block whitespace-no-wrap"
                              to={"/tv/airing-today"}
                            >
                              Günün Programı
                            </Link>
                          </li>
                          <li className="hover:cursor-pointer">
                            <Link
                              className="rounded-b bg-gray-200 hover:bg-gray-400 py-2 px-4 block whitespace-no-wrap"
                              to={"/tv/on-the-air"}
                            >
                              Televizyonda
                            </Link>
                          </li>
                        </ul>
                      </div>
                    </li>

                    <li className="px-4 py-2 hover:cursor-pointer">
                      <div className="group inline-block relative">
                        <button className="bg-gray-300 text-gray-700 font-semibold py-2 px-4 rounded inline-flex items-center">
                          <span className="mr-1">Kişiler</span>
                          <svg
                            className="fill-current h-4 w-4"
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                          </svg>
                        </button>

                        <ul className="absolute hidden text-gray-700 min-w-max pt-1 group-hover:block">
                          <li className="hover:cursor-pointer">
                            <Link
                              className="rounded-t bg-gray-200 hover:bg-gray-400 py-2 px-4 block whitespace-no-wrap"
                              to={"/person"}
                            >
                              Popüler Kişiler
                            </Link>
                          </li>
                        </ul>
                      </div>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Mobil Menü */}
          <Disclosure.Panel className="sm:hidden z-50">
            <ul className="z-50 md:flex space-x-4  dark:text-slate-100 text-slate-900">
              {/* Filmler */}
              <li className="px-4 py-2 hover:cursor-pointer w-20">
                <div className="group lg:inline-flex relative">
                  <button className="bg-gray-300 text-gray-700 font-semibold py-2 px-4 rounded inline-flex items-center">
                    <span className="mr-1">Filmler</span>
                    <svg
                      className="fill-current h-4 w-4"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                    </svg>
                  </button>

                  <ul className="ml-28 lg:ml-0 -mt-10 lg:-mt-10  absolute hidden text-gray-700 min-w-max pt-1 group-hover:block">
                    <li className="hover:cursor-pointer">
                      <Link
                        className="rounded-t bg-gray-200 hover:bg-gray-400 py-2 px-4 block whitespace-no-wrap"
                        to={"/movie"}
                      >
                        Popüler
                      </Link>
                    </li>
                    <li className="hover:cursor-pointer">
                      <Link
                        className="bg-gray-200 hover:bg-gray-400 py-2 px-4 block whitespace-no-wrap"
                        to={"/movie/now-playing"}
                      >
                        Gösterimdekiler
                      </Link>
                    </li>
                    <li className="hover:cursor-pointer">
                      <Link
                        className="rounded-b bg-gray-200 hover:bg-gray-400 py-2 px-4 block whitespace-no-wrap"
                        to={"/movie/upcoming"}
                      >
                        Yakında
                      </Link>
                    </li>
                  </ul>
                </div>
              </li>
              {/* // Diziler */}
              <li className="lg:px-4 py-2 hover:cursor-pointer w-20">
                <div className="group lg:inline-flex relative">
                  <button className="bg-gray-300 text-gray-700 font-semibold py-2 px-4 rounded inline-flex items-center">
                    <span className="mr-1">Diziler</span>
                    <svg
                      className="fill-current h-4 w-4"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                    </svg>
                  </button>

                  <ul className="ml-28 lg:ml-0 -mt-10 lg:-mt-10 absolute hidden text-gray-700 min-w-max pt-1 group-hover:block">
                    <li className="hover:cursor-pointer">
                      <Link
                        className="rounded-t bg-gray-200 hover:bg-gray-400 py-2 px-4 block whitespace-no-wrap"
                        to={"/tv"}
                      >
                        Popüler
                      </Link>
                    </li>
                    <li className="hover:cursor-pointer">
                      <Link
                        className="bg-gray-200 hover:bg-gray-400 py-2 px-4 block whitespace-no-wrap"
                        to={"/tv/airing-today"}
                      >
                        Günün Programı
                      </Link>
                    </li>
                    <li className="hover:cursor-pointer">
                      <Link
                        className="rounded-b bg-gray-200 hover:bg-gray-400 py-2 px-4 block whitespace-no-wrap"
                        to={"/tv/on-the-air"}
                      >
                        Televizyonda
                      </Link>
                    </li>
                  </ul>
                </div>
              </li>
              {/* // Kişiler */}
              <li className="lg:px-4 py-2 hover:cursor-pointer w-20">
                <div className="group lg:inline-flex relative">
                  <button className="bg-gray-300 text-gray-700 font-semibold py-2 px-4 rounded inline-flex items-center">
                    <span className="mr-1">Kişiler</span>
                    <svg
                      className="fill-current h-4 w-4"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                    </svg>
                  </button>

                  <ul className="ml-28 lg:ml-0 -mt-10 lg:-mt-10 absolute hidden text-gray-700 min-w-max pt-1 group-hover:block">
                    <li className="hover:cursor-pointer">
                      <Link
                        className="rounded-t bg-gray-200 hover:bg-gray-400 py-2 px-4 block whitespace-no-wrap"
                        to={"/person"}
                      >
                        Popüler Kişiler
                      </Link>
                    </li>
                  </ul>
                </div>
              </li>
            </ul>
          </Disclosure.Panel>
        </>
      )}
    </Disclosure>
  );
}

export default Navbar;
