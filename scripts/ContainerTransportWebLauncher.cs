using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Net;
using System.Net.NetworkInformation;
using System.Text.RegularExpressions;
using System.Threading;
using System.Windows.Forms;

namespace ContainerTransportWebLauncher
{
    internal static class Program
    {
        private const int Port = 3000;
        private const string Url = "http://127.0.0.1:3000/login";

        [STAThread]
        private static void Main()
        {
            try
            {
                var baseDirectory = AppDomain.CurrentDomain.BaseDirectory;
                var serverPath = Path.Combine(baseDirectory, "server.js");

                if (!File.Exists(serverPath))
                {
                    ShowError("server.js was not found. Keep this launcher in the same folder as the web package.");
                    return;
                }

                var nodePath = FindNodeExecutable();
                if (string.IsNullOrWhiteSpace(nodePath))
                {
                    ShowError("Node.js was not found. Install Node.js first and make sure the node command is available.");
                    return;
                }

                StopProcessesUsingPort(Port);
                StartWebServer(baseDirectory, nodePath);
                WaitForServerReady(Url, 30000);

                Process.Start(new ProcessStartInfo
                {
                    FileName = Url,
                    UseShellExecute = true,
                });
            }
            catch (Exception ex)
            {
                ShowError("Startup failed:\r\n" + ex.Message + "\r\n\r\nCheck web-server.stdout.log and web-server.stderr.log in this folder.");
            }
        }

        private static string FindNodeExecutable()
        {
            var processStartInfo = new ProcessStartInfo
            {
                FileName = "where",
                Arguments = "node",
                UseShellExecute = false,
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                CreateNoWindow = true,
            };

            using (var process = Process.Start(processStartInfo))
            {
                if (process == null)
                {
                    return string.Empty;
                }

                var output = process.StandardOutput.ReadToEnd();
                process.WaitForExit();

                return output
                    .Split(new[] { '\r', '\n' }, StringSplitOptions.RemoveEmptyEntries)
                    .FirstOrDefault() ?? string.Empty;
            }
        }

        private static void StopProcessesUsingPort(int port)
        {
            var pids = new HashSet<int>();
            var processStartInfo = new ProcessStartInfo
            {
                FileName = "netstat",
                Arguments = "-ano -p tcp",
                UseShellExecute = false,
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                CreateNoWindow = true,
            };

            using (var process = Process.Start(processStartInfo))
            {
                if (process == null)
                {
                    return;
                }

                var output = process.StandardOutput.ReadToEnd();
                process.WaitForExit();

                foreach (var rawLine in output.Split(new[] { '\r', '\n' }, StringSplitOptions.RemoveEmptyEntries))
                {
                    var line = rawLine.Trim();
                    if (!line.StartsWith("TCP", StringComparison.OrdinalIgnoreCase))
                    {
                        continue;
                    }

                    var parts = Regex.Split(line, "\\s+");
                    if (parts.Length < 5)
                    {
                        continue;
                    }

                    var localAddress = parts[1];
                    if (!localAddress.EndsWith(":" + port, StringComparison.Ordinal))
                    {
                        continue;
                    }

                    int pid;
                    if (!int.TryParse(parts[parts.Length - 1], out pid))
                    {
                        continue;
                    }

                    if (pid <= 0 || pid == Process.GetCurrentProcess().Id)
                    {
                        continue;
                    }

                    pids.Add(pid);
                }
            }

            foreach (var pid in pids)
            {
                try
                {
                    var process = Process.GetProcessById(pid);
                    process.Kill();
                    process.WaitForExit(5000);
                }
                catch
                {
                }
            }

            var deadline = DateTime.UtcNow.AddSeconds(10);
            while (DateTime.UtcNow < deadline)
            {
                var isStillListening = IPGlobalProperties
                    .GetIPGlobalProperties()
                    .GetActiveTcpListeners()
                    .Any(endpoint => endpoint.Port == port);

                if (!isStillListening)
                {
                    return;
                }

                Thread.Sleep(300);
            }
        }

        private static void StartWebServer(string workingDirectory, string nodePath)
        {
            var processStartInfo = new ProcessStartInfo
            {
                FileName = "cmd.exe",
                Arguments = "/c \"" + Quote(nodePath) + " server.js 1>>web-server.stdout.log 2>>web-server.stderr.log\"",
                WorkingDirectory = workingDirectory,
                UseShellExecute = false,
                CreateNoWindow = true,
            };

            processStartInfo.EnvironmentVariables["HOSTNAME"] = "0.0.0.0";
            processStartInfo.EnvironmentVariables["PORT"] = Port.ToString();

            var process = Process.Start(processStartInfo);
            if (process == null)
            {
                throw new InvalidOperationException("Failed to start the Node.js process.");
            }
        }

        private static void WaitForServerReady(string url, int timeoutMilliseconds)
        {
            var deadline = DateTime.UtcNow.AddMilliseconds(timeoutMilliseconds);

            while (DateTime.UtcNow < deadline)
            {
                try
                {
                    var request = WebRequest.CreateHttp(url);
                    request.Method = "GET";
                    request.Timeout = 2000;

                    using (var response = (HttpWebResponse)request.GetResponse())
                    {
                        if ((int)response.StatusCode >= 200 && (int)response.StatusCode < 500)
                        {
                            return;
                        }
                    }
                }
                catch
                {
                }

                Thread.Sleep(1000);
            }

            throw new TimeoutException("The web service was not ready within 30 seconds.");
        }

        private static string Quote(string value)
        {
            return "\"" + value + "\"";
        }

        private static void ShowError(string message)
        {
            MessageBox.Show(
                message,
                "Container Transport",
                MessageBoxButtons.OK,
                MessageBoxIcon.Error);
        }
    }
}
