using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Reflection;
using System.Threading.Tasks;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Documents;
using System.Windows.Input;
using System.Windows.Markup;
using System.Windows.Media;
using System.Windows.Media.Imaging;
using SPath = System.Windows.Shapes.Path;

namespace NyaCord.Installer
{
    public class DiscordEntry
    {
        public string Name { get; set; }
        public string Branch { get; set; }
        public string Path { get; set; }
        public string AppPath { get; set; }
        public bool IsPatched { get; set; }
        public string Version { get; set; }

        public override string ToString()
        {
            if (string.IsNullOrEmpty(Path))
                return Name;
            return string.Format("{0} ({1}) - {2}", Name, Version, IsPatched ? "Patched (=^･ω･^=)" : "Not patched");
        }
    }

    public class MainWindow : Window
    {
        private ComboBox _discordCombo;
        private TextBox _customPathBox;
        private Button _browseBtn;
        private Button _installBtn;
        private Button _repairBtn;
        private Button _uninstallBtn;
        private Button _openAsarBtn;
        private Border _statusBadgeBorder;
        private TextBlock _statusText;
        private RichTextBox _logBox;
        private List<DiscordEntry> _discords = new List<DiscordEntry>();

        private readonly Color ColBg = Color.FromRgb(0x1E, 0x1F, 0x24);
        private readonly Color ColPanel = Color.FromRgb(0x26, 0x28, 0x2E);
        private readonly Color ColInput = Color.FromRgb(0x1B, 0x1C, 0x20);
        private readonly Color ColBorder = Color.FromRgb(0x38, 0x3A, 0x42);
        private readonly Color ColText = Color.FromRgb(0xD0, 0xD3, 0xD9);
        private readonly Color ColTextBright = Color.FromRgb(0xF6, 0xF7, 0xF9);
        private readonly Color ColTextMuted = Color.FromRgb(0x97, 0x9C, 0xA7);
        private readonly Color ColBlush = Color.FromRgb(0xFF, 0x94, 0xB8);
        private readonly Color ColBlushBg = Color.FromRgb(0x35, 0x24, 0x2E);
        private readonly Color ColPrimary = Color.FromRgb(0x79, 0x83, 0xF5);
        private readonly Color ColPrimaryHover = Color.FromRgb(0x8B, 0x94, 0xFF);
        private readonly Color ColPrimaryPressed = Color.FromRgb(0x6C, 0x75, 0xE8);
        private readonly Color ColBtnSecondary = Color.FromRgb(0x32, 0x35, 0x3D);
        private readonly Color ColBtnSecondaryHover = Color.FromRgb(0x3D, 0x40, 0x4A);
        private readonly Color ColBtnSecondaryPressed = Color.FromRgb(0x2A, 0x2C, 0x33);
        private readonly Color ColSuccess = Color.FromRgb(0x57, 0xF2, 0x87);
        private readonly Color ColDanger = Color.FromRgb(0xED, 0x42, 0x45);
        private readonly Color ColAmber = Color.FromRgb(0xFE, 0xE7, 0x5C);

        private const string IconCatPaw = "M12 14c-2.5 0-5 2-4 5 1 2.5 7 2.5 8 0 1-3-1.5-5-4-5z M6.5 12c-1 0-1.5 1.5-1 2.5.5 1 2 1 2.5 0s-.5-2.5-1.5-2.5z M9.5 8c-1 0-1.5 1.5-1 2.5.5 1 2 1 2.5 0s-.5-2.5-1.5-2.5z M14.5 8c-1 0-1.5 1.5-1 2.5.5 1 2 1 2.5 0s-.5-2.5-1.5-2.5z M17.5 12c-1 0-1.5 1.5-1 2.5.5 1 2 1 2.5 0s-.5-2.5-1.5-2.5z";
        private const string IconSync = "M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z";
        private const string IconTrash = "M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z";
        private const string IconBolt = "M11 21h-1l1-7H7.5c-.88 0-.33-.75-.31-.78C8.48 10.94 10.42 7.54 13 3h1l-1 7h3.5c.49 0 .56.33.47.51l-6 10.49z";
        private const string IconFolder = "M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z";
        private const string IconExternal = "M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z";

        public MainWindow()
        {
            Title = "NyaCord Installer (=^･ω･^=)";
            Width = 575;
            Height = 590;
            WindowStartupLocation = WindowStartupLocation.CenterScreen;
            Background = new SolidColorBrush(ColBg);
            Foreground = new SolidColorBrush(ColText);
            FontFamily = new FontFamily("Segoe UI, -apple-system, BlinkMacSystemFont, Roboto, sans-serif");
            ResizeMode = ResizeMode.CanMinimize;

            BuildInterface();
            ScanDiscords();
            AppendLog("NyaCord Installer ready (=^･ω･^=)\n", ColBlush);
        }

        private void BuildInterface()
        {
            var mainGrid = new Grid { Margin = new Thickness(22) };
            var rootStack = new StackPanel { Orientation = Orientation.Vertical };

            // --- HEADER ---
            var header = new Grid { Margin = new Thickness(0, 0, 0, 18) };
            header.ColumnDefinitions.Add(new ColumnDefinition { Width = GridLength.Auto });
            header.ColumnDefinitions.Add(new ColumnDefinition { Width = new GridLength(1, GridUnitType.Star) });
            header.ColumnDefinitions.Add(new ColumnDefinition { Width = GridLength.Auto });

            var iconImage = new Image
            {
                Width = 44,
                Height = 44,
                Margin = new Thickness(0, 0, 14, 0),
                VerticalAlignment = VerticalAlignment.Center
            };
            try
            {
                using (var stream = Assembly.GetExecutingAssembly().GetManifestResourceStream("logo.png"))
                {
                    if (stream != null)
                    {
                        var bmp = new BitmapImage();
                        bmp.BeginInit();
                        bmp.CacheOption = BitmapCacheOption.OnLoad;
                        bmp.StreamSource = stream;
                        bmp.EndInit();
                        iconImage.Source = bmp;
                    }
                }
            }
            catch { }

            Grid.SetColumn(iconImage, 0);
            header.Children.Add(iconImage);

            var titleStack = new StackPanel { VerticalAlignment = VerticalAlignment.Center };
            var titleRow = new StackPanel { Orientation = Orientation.Horizontal, VerticalAlignment = VerticalAlignment.Center };

            var titleText = new TextBlock
            {
                Text = "NyaCord Installer",
                FontSize = 18,
                FontWeight = FontWeights.SemiBold,
                Foreground = new SolidColorBrush(ColTextBright)
            };
            titleRow.Children.Add(titleText);

            // Kawaii Neko Badge
            var nekoBadge = new Border
            {
                Background = new SolidColorBrush(ColBlushBg),
                BorderBrush = new SolidColorBrush(ColBlush),
                BorderThickness = new Thickness(1),
                CornerRadius = new CornerRadius(10),
                Padding = new Thickness(7, 2, 7, 2),
                Margin = new Thickness(8, 0, 0, 0),
                VerticalAlignment = VerticalAlignment.Center
            };
            var nekoText = new TextBlock
            {
                Text = "(=^･ω･^=)",
                FontSize = 11,
                FontWeight = FontWeights.SemiBold,
                Foreground = new SolidColorBrush(ColBlush)
            };
            nekoBadge.Child = nekoText;
            titleRow.Children.Add(nekoBadge);

            titleStack.Children.Add(titleRow);

            var subText = new TextBlock
            {
                Text = "Kawaii desktop client modification patcher",
                FontSize = 12,
                Foreground = new SolidColorBrush(ColTextMuted),
                Margin = new Thickness(0, 3, 0, 0)
            };
            titleStack.Children.Add(subText);
            Grid.SetColumn(titleStack, 1);
            header.Children.Add(titleStack);

            // Version badge
            var verBorder = new Border
            {
                Background = new SolidColorBrush(ColPanel),
                BorderBrush = new SolidColorBrush(ColBorder),
                BorderThickness = new Thickness(1),
                CornerRadius = new CornerRadius(10),
                Padding = new Thickness(8, 3, 8, 3),
                VerticalAlignment = VerticalAlignment.Center
            };
            var verText = new TextBlock
            {
                Text = "v1.0.0",
                FontSize = 11,
                Foreground = new SolidColorBrush(ColTextMuted)
            };
            verBorder.Child = verText;
            Grid.SetColumn(verBorder, 2);
            header.Children.Add(verBorder);

            rootStack.Children.Add(header);

            // --- CARD: DISCORD INSTALLATION ---
            var card = new Border
            {
                Background = new SolidColorBrush(ColPanel),
                BorderBrush = new SolidColorBrush(ColBorder),
                BorderThickness = new Thickness(1),
                CornerRadius = new CornerRadius(8),
                Padding = new Thickness(15),
                Margin = new Thickness(0, 0, 0, 14)
            };
            var cardStack = new StackPanel();

            var cardHeader = new Grid { Margin = new Thickness(0, 0, 0, 10) };
            cardHeader.ColumnDefinitions.Add(new ColumnDefinition { Width = new GridLength(1, GridUnitType.Star) });
            cardHeader.ColumnDefinitions.Add(new ColumnDefinition { Width = GridLength.Auto });

            var sectionLabelRow = new StackPanel { Orientation = Orientation.Horizontal, VerticalAlignment = VerticalAlignment.Center };
            var pawIcon = new SPath
            {
                Data = Geometry.Parse(IconCatPaw),
                Fill = new SolidColorBrush(ColBlush),
                Width = 14,
                Height = 14,
                Stretch = Stretch.Uniform,
                VerticalAlignment = VerticalAlignment.Center,
                Margin = new Thickness(0, 0, 6, 0)
            };
            sectionLabelRow.Children.Add(pawIcon);

            var sectionLabel = new TextBlock
            {
                Text = "TARGET DISCORD INSTALLATION",
                FontSize = 11,
                FontWeight = FontWeights.Bold,
                Foreground = new SolidColorBrush(ColTextMuted),
                VerticalAlignment = VerticalAlignment.Center
            };
            sectionLabelRow.Children.Add(sectionLabel);
            Grid.SetColumn(sectionLabelRow, 0);
            cardHeader.Children.Add(sectionLabelRow);

            // Cute Status Pill without dot
            _statusBadgeBorder = new Border
            {
                CornerRadius = new CornerRadius(10),
                Padding = new Thickness(10, 3, 10, 3),
                Background = new SolidColorBrush(Color.FromArgb(30, 254, 231, 92)),
                BorderBrush = new SolidColorBrush(ColAmber),
                BorderThickness = new Thickness(1),
                VerticalAlignment = VerticalAlignment.Center
            };
            _statusText = new TextBlock
            {
                Text = "Scanning...",
                FontSize = 11,
                FontWeight = FontWeights.SemiBold,
                Foreground = new SolidColorBrush(ColAmber),
                VerticalAlignment = VerticalAlignment.Center
            };
            _statusBadgeBorder.Child = _statusText;
            Grid.SetColumn(_statusBadgeBorder, 1);
            cardHeader.Children.Add(_statusBadgeBorder);

            cardStack.Children.Add(cardHeader);

            // Fully Styled Dark ComboBox
            _discordCombo = new ComboBox
            {
                Height = 36,
                Background = new SolidColorBrush(ColInput),
                Foreground = new SolidColorBrush(ColText),
                BorderBrush = new SolidColorBrush(ColBorder),
                FontSize = 12.5,
                Margin = new Thickness(0, 0, 0, 10)
            };

            // Custom ComboBox ControlTemplate
            string comboXaml = @"<ControlTemplate TargetType=""ComboBox"" xmlns=""http://schemas.microsoft.com/winfx/2006/xaml/presentation"" xmlns:x=""http://schemas.microsoft.com/winfx/2006/xaml"">
              <Grid>
                <ToggleButton Name=""ToggleButton""
                              Background=""{TemplateBinding Background}""
                              BorderBrush=""{TemplateBinding BorderBrush}""
                              BorderThickness=""{TemplateBinding BorderThickness}""
                              Focusable=""False""
                              IsChecked=""{Binding Path=IsDropDownOpen, Mode=TwoWay, RelativeSource={RelativeSource TemplatedParent}}""
                              ClickMode=""Press"">
                  <ToggleButton.Template>
                    <ControlTemplate TargetType=""ToggleButton"">
                      <Border Name=""Border"" Background=""{TemplateBinding Background}"" BorderBrush=""{TemplateBinding BorderBrush}"" BorderThickness=""{TemplateBinding BorderThickness}"" CornerRadius=""6"">
                        <Grid>
                          <Grid.ColumnDefinitions>
                            <ColumnDefinition />
                            <ColumnDefinition Width=""28"" />
                          </Grid.ColumnDefinitions>
                          <Path Grid.Column=""1"" HorizontalAlignment=""Center"" VerticalAlignment=""Center"" Data=""M 0 0 L 4 4 L 8 0 Z"" Fill=""#979CA7"" />
                        </Grid>
                      </Border>
                      <ControlTemplate.Triggers>
                        <Trigger Property=""IsMouseOver"" Value=""True"">
                          <Setter TargetName=""Border"" Property=""Background"" Value=""#282A31"" />
                          <Setter TargetName=""Border"" Property=""BorderBrush"" Value=""#4A4D57"" />
                        </Trigger>
                      </ControlTemplate.Triggers>
                    </ControlTemplate>
                  </ToggleButton.Template>
                </ToggleButton>
                <ContentPresenter Name=""ContentSite""
                                  IsHitTestVisible=""False""
                                  Content=""{TemplateBinding SelectionBoxItem}""
                                  ContentTemplate=""{TemplateBinding SelectionBoxItemTemplate}""
                                  ContentTemplateSelector=""{TemplateBinding ItemTemplateSelector}""
                                  Margin=""12,0,28,0""
                                  VerticalAlignment=""Center""
                                  HorizontalAlignment=""Left"" />
                <Popup Name=""PART_Popup""
                       Placement=""Bottom""
                       IsOpen=""{TemplateBinding IsDropDownOpen}""
                       AllowsTransparency=""True""
                       Focusable=""False""
                       PopupAnimation=""Slide"">
                  <Grid Name=""DropDown""
                        MinWidth=""{TemplateBinding ActualWidth}""
                        MaxHeight=""{TemplateBinding MaxDropDownHeight}"">
                    <Border Name=""DropDownBorder""
                            Background=""#26282E""
                            BorderBrush=""#383A42""
                            BorderThickness=""1""
                            CornerRadius=""6""
                            Margin=""0,2,0,0"">
                      <ScrollViewer Margin=""4,6,4,6"" SnapsToDevicePixels=""True"">
                        <StackPanel IsItemsHost=""True"" KeyboardNavigation.DirectionalNavigation=""Contained"" />
                      </ScrollViewer>
                    </Border>
                  </Grid>
                </Popup>
              </Grid>
            </ControlTemplate>";

            string itemXaml = @"<Style TargetType=""ComboBoxItem"" xmlns=""http://schemas.microsoft.com/winfx/2006/xaml/presentation"">
              <Setter Property=""Background"" Value=""#26282E"" />
              <Setter Property=""Foreground"" Value=""#D0D3D9"" />
              <Setter Property=""Padding"" Value=""10,7,10,7"" />
              <Setter Property=""Template"">
                <Setter.Value>
                  <ControlTemplate TargetType=""ComboBoxItem"">
                    <Border Name=""ItemBorder"" Background=""{TemplateBinding Background}"" CornerRadius=""4"" Padding=""{TemplateBinding Padding}"" Margin=""0,1,0,1"">
                      <ContentPresenter />
                    </Border>
                    <ControlTemplate.Triggers>
                      <Trigger Property=""IsMouseOver"" Value=""True"">
                        <Setter TargetName=""ItemBorder"" Property=""Background"" Value=""#353842"" />
                        <Setter Property=""Foreground"" Value=""#FFFFFF"" />
                      </Trigger>
                      <Trigger Property=""IsSelected"" Value=""True"">
                        <Setter TargetName=""ItemBorder"" Property=""Background"" Value=""#7983F5"" />
                        <Setter Property=""Foreground"" Value=""#FFFFFF"" />
                      </Trigger>
                    </ControlTemplate.Triggers>
                  </ControlTemplate>
                </Setter.Value>
              </Setter>
            </Style>";

            try
            {
                _discordCombo.Template = (ControlTemplate)XamlReader.Parse(comboXaml);
                _discordCombo.ItemContainerStyle = (Style)XamlReader.Parse(itemXaml);
            }
            catch { }

            _discordCombo.SelectionChanged += OnSelectionChanged;
            cardStack.Children.Add(_discordCombo);

            var pathRow = new Grid();
            pathRow.ColumnDefinitions.Add(new ColumnDefinition { Width = new GridLength(1, GridUnitType.Star) });
            pathRow.ColumnDefinitions.Add(new ColumnDefinition { Width = GridLength.Auto });

            _customPathBox = new TextBox
            {
                Height = 32,
                Background = new SolidColorBrush(ColInput),
                Foreground = new SolidColorBrush(ColText),
                BorderBrush = new SolidColorBrush(ColBorder),
                FontSize = 12,
                VerticalContentAlignment = VerticalAlignment.Center,
                Padding = new Thickness(8, 0, 8, 0),
                IsEnabled = false
            };
            Grid.SetColumn(_customPathBox, 0);
            pathRow.Children.Add(_customPathBox);

            _browseBtn = CreateActionButton("Browse", IconFolder, ColBtnSecondary, ColBtnSecondaryHover, ColBtnSecondaryPressed, ColText, 86, 32, 13, false);
            _browseBtn.Margin = new Thickness(8, 0, 0, 0);
            _browseBtn.IsEnabled = false;
            _browseBtn.Click += OnBrowseClicked;
            Grid.SetColumn(_browseBtn, 1);
            pathRow.Children.Add(_browseBtn);

            cardStack.Children.Add(pathRow);
            card.Child = cardStack;
            rootStack.Children.Add(card);

            // --- PRIMARY ACTION BUTTON ---
            _installBtn = CreateActionButton("Install NyaCord 🐾", IconCatPaw, ColPrimary, ColPrimaryHover, ColPrimaryPressed, Colors.White, 0, 42, 16, true);
            _installBtn.Margin = new Thickness(0, 0, 0, 10);
            _installBtn.Click += (s, e) => ExecuteAction("--install");
            rootStack.Children.Add(_installBtn);

            // --- SECONDARY ACTION BUTTONS ---
            var subGrid = new Grid { Margin = new Thickness(0, 0, 0, 14) };
            subGrid.ColumnDefinitions.Add(new ColumnDefinition { Width = new GridLength(1, GridUnitType.Star) });
            subGrid.ColumnDefinitions.Add(new ColumnDefinition { Width = new GridLength(1, GridUnitType.Star) });
            subGrid.ColumnDefinitions.Add(new ColumnDefinition { Width = new GridLength(1, GridUnitType.Star) });

            _repairBtn = CreateActionButton("Repair", IconSync, ColBtnSecondary, ColBtnSecondaryHover, ColBtnSecondaryPressed, ColText, 0, 34, 13, false);
            _repairBtn.Margin = new Thickness(0, 0, 4, 0);
            _repairBtn.Click += (s, e) => ExecuteAction("--repair");
            Grid.SetColumn(_repairBtn, 0);
            subGrid.Children.Add(_repairBtn);

            _uninstallBtn = CreateActionButton("Uninstall", IconTrash, ColBtnSecondary, Color.FromRgb(0x4A, 0x25, 0x28), Color.FromRgb(0x3B, 0x1D, 0x20), ColText, 0, 34, 13, false);
            _uninstallBtn.Margin = new Thickness(4, 0, 4, 0);
            _uninstallBtn.Click += (s, e) => ExecuteAction("--uninstall");
            Grid.SetColumn(_uninstallBtn, 1);
            subGrid.Children.Add(_uninstallBtn);

            _openAsarBtn = CreateActionButton("OpenAsar", IconBolt, ColBtnSecondary, ColBtnSecondaryHover, ColBtnSecondaryPressed, ColText, 0, 34, 13, false);
            _openAsarBtn.Margin = new Thickness(4, 0, 0, 0);
            _openAsarBtn.Click += (s, e) => ToggleOpenAsar();
            Grid.SetColumn(_openAsarBtn, 2);
            subGrid.Children.Add(_openAsarBtn);

            rootStack.Children.Add(subGrid);

            // --- UTILITY SHORTCUTS ---
            var linkGrid = new Grid { Margin = new Thickness(0, 0, 0, 12) };
            linkGrid.ColumnDefinitions.Add(new ColumnDefinition { Width = new GridLength(1, GridUnitType.Star) });
            linkGrid.ColumnDefinitions.Add(new ColumnDefinition { Width = GridLength.Auto });

            var pluginsLink = CreateLinkItem("UserPlugins Folder", IconFolder, () => OpenUserPluginsFolder());
            Grid.SetColumn(pluginsLink, 0);
            linkGrid.Children.Add(pluginsLink);

            var gitLink = CreateLinkItem("GitHub Repository", IconExternal, () => Process.Start("https://github.com/nyawkdev/NyaCord"));
            Grid.SetColumn(gitLink, 1);
            linkGrid.Children.Add(gitLink);

            rootStack.Children.Add(linkGrid);

            // --- LOG AREA ---
            var logBorder = new Border
            {
                Background = new SolidColorBrush(Color.FromRgb(0x14, 0x15, 0x18)),
                BorderBrush = new SolidColorBrush(ColBorder),
                BorderThickness = new Thickness(1),
                CornerRadius = new CornerRadius(7),
                Padding = new Thickness(10)
            };
            _logBox = new RichTextBox
            {
                Height = 135,
                Background = Brushes.Transparent,
                Foreground = new SolidColorBrush(ColTextMuted),
                BorderThickness = new Thickness(0),
                FontFamily = new FontFamily("Consolas, monospace"),
                FontSize = 11,
                IsReadOnly = true,
                VerticalScrollBarVisibility = ScrollBarVisibility.Auto
            };
            logBorder.Child = _logBox;
            rootStack.Children.Add(logBorder);

            mainGrid.Children.Add(rootStack);
            Content = mainGrid;
        }

        private Button CreateActionButton(string text, string iconPathData, Color normalBg, Color hoverBg, Color pressedBg, Color fgColor, double width, double height, double iconSize, bool isPrimary)
        {
            var btn = new Button
            {
                Height = height,
                Background = new SolidColorBrush(normalBg),
                Foreground = new SolidColorBrush(fgColor),
                BorderBrush = isPrimary ? Brushes.Transparent : new SolidColorBrush(ColBorder),
                BorderThickness = isPrimary ? new Thickness(0) : new Thickness(1),
                Cursor = Cursors.Hand,
                FontSize = isPrimary ? 13.5 : 12,
                FontWeight = isPrimary ? FontWeights.SemiBold : FontWeights.Normal
            };
            if (width > 0) btn.Width = width;

            SetButtonInnerContent(btn, text, iconPathData, fgColor, iconSize);

            var template = new ControlTemplate(typeof(Button));
            var borderFactory = new FrameworkElementFactory(typeof(Border));
            borderFactory.SetValue(Border.CornerRadiusProperty, new CornerRadius(7));
            borderFactory.SetValue(Border.BackgroundProperty, new TemplateBindingExtension(Button.BackgroundProperty));
            borderFactory.SetValue(Border.BorderBrushProperty, new TemplateBindingExtension(Button.BorderBrushProperty));
            borderFactory.SetValue(Border.BorderThicknessProperty, new TemplateBindingExtension(Button.BorderThicknessProperty));

            var contentFactory = new FrameworkElementFactory(typeof(ContentPresenter));
            contentFactory.SetValue(ContentPresenter.HorizontalAlignmentProperty, HorizontalAlignment.Center);
            contentFactory.SetValue(ContentPresenter.VerticalAlignmentProperty, VerticalAlignment.Center);
            borderFactory.AppendChild(contentFactory);

            template.VisualTree = borderFactory;
            btn.Template = template;

            btn.MouseEnter += (s, e) => {
                if (btn.IsEnabled) btn.Background = new SolidColorBrush(hoverBg);
            };
            btn.MouseLeave += (s, e) => {
                if (btn.IsEnabled) btn.Background = new SolidColorBrush(normalBg);
            };
            btn.PreviewMouseDown += (s, e) => {
                if (btn.IsEnabled) btn.Background = new SolidColorBrush(pressedBg);
            };
            btn.PreviewMouseUp += (s, e) => {
                if (btn.IsEnabled) btn.Background = new SolidColorBrush(hoverBg);
            };

            return btn;
        }

        private void SetButtonInnerContent(Button btn, string text, string iconPathData, Color fgColor, double iconSize)
        {
            var stack = new StackPanel
            {
                Orientation = Orientation.Horizontal,
                HorizontalAlignment = HorizontalAlignment.Center,
                VerticalAlignment = VerticalAlignment.Center
            };

            if (!string.IsNullOrEmpty(iconPathData))
            {
                var icon = new SPath
                {
                    Data = Geometry.Parse(iconPathData),
                    Fill = new SolidColorBrush(fgColor),
                    Width = iconSize,
                    Height = iconSize,
                    Stretch = Stretch.Uniform,
                    VerticalAlignment = VerticalAlignment.Center,
                    Margin = new Thickness(0, 0, 7, 0)
                };
                stack.Children.Add(icon);
            }

            var label = new TextBlock
            {
                Text = text,
                VerticalAlignment = VerticalAlignment.Center
            };
            stack.Children.Add(label);

            btn.Content = stack;
        }

        private FrameworkElement CreateLinkItem(string text, string iconPathData, Action onClick)
        {
            var stack = new StackPanel
            {
                Orientation = Orientation.Horizontal,
                Cursor = Cursors.Hand,
                VerticalAlignment = VerticalAlignment.Center
            };

            var icon = new SPath
            {
                Data = Geometry.Parse(iconPathData),
                Fill = new SolidColorBrush(ColTextMuted),
                Width = 13,
                Height = 13,
                Stretch = Stretch.Uniform,
                VerticalAlignment = VerticalAlignment.Center,
                Margin = new Thickness(0, 0, 6, 0)
            };
            stack.Children.Add(icon);

            var label = new TextBlock
            {
                Text = text,
                FontSize = 11.5,
                Foreground = new SolidColorBrush(ColTextMuted),
                VerticalAlignment = VerticalAlignment.Center
            };
            stack.Children.Add(label);

            stack.MouseEnter += (s, e) =>
            {
                icon.Fill = new SolidColorBrush(ColBlush);
                label.Foreground = new SolidColorBrush(ColBlush);
            };
            stack.MouseLeave += (s, e) =>
            {
                icon.Fill = new SolidColorBrush(ColTextMuted);
                label.Foreground = new SolidColorBrush(ColTextMuted);
            };
            stack.MouseDown += (s, e) => onClick();

            return stack;
        }

        private void AppendLog(string text, Color color)
        {
            Dispatcher.Invoke(() =>
            {
                var p = _logBox.Document.Blocks.LastBlock as Paragraph;
                if (p == null)
                {
                    p = new Paragraph();
                    _logBox.Document.Blocks.Add(p);
                }
                p.Inlines.Add(new Run(text) { Foreground = new SolidColorBrush(color) });
                _logBox.ScrollToEnd();
            });
        }

        private void SetStatus(string text, Color color, Color bg)
        {
            _statusText.Text = text;
            _statusText.Foreground = new SolidColorBrush(color);
            _statusBadgeBorder.BorderBrush = new SolidColorBrush(color);
            _statusBadgeBorder.Background = new SolidColorBrush(bg);
        }

        private void ScanDiscords()
        {
            _discords.Clear();
            string localAppData = Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData);

            var targets = new Dictionary<string, string>
            {
                { "Discord Stable", "Discord" },
                { "Discord PTB", "DiscordPTB" },
                { "Discord Canary", "DiscordCanary" },
                { "Discord Development", "DiscordDevelopment" }
            };

            foreach (var kvp in targets)
            {
                string targetPath = Path.Combine(localAppData, kvp.Value);
                if (Directory.Exists(targetPath))
                {
                    var entry = ParseDiscordDir(kvp.Key, targetPath);
                    if (entry != null)
                        _discords.Add(entry);
                }
            }

            _discordCombo.Items.Clear();
            foreach (var d in _discords)
            {
                _discordCombo.Items.Add(d);
            }
            _discordCombo.Items.Add(new DiscordEntry { Name = "Custom location...", Path = "" });

            if (_discords.Count > 0)
            {
                _discordCombo.SelectedIndex = 0;
            }
            else
            {
                _discordCombo.SelectedIndex = _discordCombo.Items.Count - 1;
                SetStatus("No Discord found", ColDanger, Color.FromArgb(30, 237, 66, 69));
            }
        }

        private DiscordEntry ParseDiscordDir(string name, string dir)
        {
            try
            {
                var appDirs = Directory.GetDirectories(dir, "app-*");
                if (appDirs.Length == 0) return null;

                Array.Sort(appDirs);
                string latestAppDir = appDirs[appDirs.Length - 1];
                string ver = Path.GetFileName(latestAppDir).Replace("app-", "");

                string resources = Path.Combine(latestAppDir, "resources");
                bool isPatched = File.Exists(Path.Combine(resources, "_app.asar"));

                string branch = "stable";
                if (name.Contains("Canary")) branch = "canary";
                else if (name.Contains("PTB")) branch = "ptb";
                else if (name.Contains("Development")) branch = "dev";

                return new DiscordEntry
                {
                    Name = name,
                    Branch = branch,
                    Path = dir,
                    AppPath = latestAppDir,
                    IsPatched = isPatched,
                    Version = ver
                };
            }
            catch
            {
                return null;
            }
        }

        private void OnSelectionChanged(object sender, SelectionChangedEventArgs e)
        {
            var selected = _discordCombo.SelectedItem as DiscordEntry;
            if (selected == null) return;

            if (string.IsNullOrEmpty(selected.Path))
            {
                _customPathBox.IsEnabled = true;
                _browseBtn.IsEnabled = true;
                _customPathBox.Text = "";
                SetButtonInnerContent(_installBtn, "Install NyaCord 🐾", IconCatPaw, Colors.White, 16);
                SetStatus("Custom location", ColTextMuted, Color.FromArgb(30, 151, 156, 167));
            }
            else
            {
                _customPathBox.IsEnabled = false;
                _browseBtn.IsEnabled = false;
                _customPathBox.Text = selected.Path;

                if (selected.IsPatched)
                {
                    SetButtonInnerContent(_installBtn, "Reinstall NyaCord 🐾", IconCatPaw, Colors.White, 16);
                    SetStatus("Patched (=^･ω･^=)", ColSuccess, Color.FromArgb(30, 87, 242, 135));
                }
                else
                {
                    SetButtonInnerContent(_installBtn, "Install NyaCord 🐾", IconCatPaw, Colors.White, 16);
                    SetStatus("Not patched", ColTextMuted, Color.FromArgb(30, 151, 156, 167));
                }
            }
        }

        private void OnBrowseClicked(object sender, RoutedEventArgs e)
        {
            var dialog = new System.Windows.Forms.FolderBrowserDialog
            {
                Description = "Select Discord directory"
            };
            if (dialog.ShowDialog() == System.Windows.Forms.DialogResult.OK)
            {
                _customPathBox.Text = dialog.SelectedPath;
                var entry = ParseDiscordDir("Custom Discord", dialog.SelectedPath);
                if (entry != null)
                {
                    AppendLog(string.Format("Selected: {0} ({1})\n", dialog.SelectedPath, entry.Version), ColSuccess);
                }
            }
        }

        private void OpenUserPluginsFolder()
        {
            string appData = Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData);
            string userPluginsDir = Path.Combine(appData, "NyaCord", "userplugins");
            try
            {
                if (!Directory.Exists(userPluginsDir))
                    Directory.CreateDirectory(userPluginsDir);

                Process.Start("explorer.exe", userPluginsDir);
                AppendLog(string.Format("Opened plugins folder: {0}\n", userPluginsDir), ColBlush);
            }
            catch (Exception ex)
            {
                AppendLog(string.Format("Error opening plugins: {0}\n", ex.Message), ColDanger);
            }
        }

        private string ResolveCliPath()
        {
            string dir = AppDomain.CurrentDomain.BaseDirectory;

            string local = Path.Combine(dir, "NyaCordInstallerCli.exe");
            if (File.Exists(local)) return local;

            string parent = Path.Combine(dir, "..", "NyaCordInstallerCli.exe");
            if (File.Exists(parent)) return Path.GetFullPath(parent);

            try
            {
                string tempDir = Path.Combine(Path.GetTempPath(), "NyaCord");
                Directory.CreateDirectory(tempDir);
                string extracted = Path.Combine(tempDir, "NyaCordInstallerCli.exe");

                using (var stream = Assembly.GetExecutingAssembly().GetManifestResourceStream("NyaCordInstallerCli.exe"))
                {
                    if (stream != null)
                    {
                        using (var fileStream = File.Create(extracted))
                        {
                            stream.CopyTo(fileStream);
                        }
                        return extracted;
                    }
                }
            }
            catch { }

            return null;
        }

        private async void ExecuteAction(string actionFlag)
        {
            string cli = ResolveCliPath();
            if (string.IsNullOrEmpty(cli) || !File.Exists(cli))
            {
                AppendLog("Error: NyaCordInstallerCli.exe not found.\n", ColDanger);
                return;
            }

            var selected = _discordCombo.SelectedItem as DiscordEntry;
            string targetArg = "";

            if (selected != null && !string.IsNullOrEmpty(selected.Path))
            {
                targetArg = string.Format("-location \"{0}\"", selected.Path);
            }
            else if (!string.IsNullOrEmpty(_customPathBox.Text) && Directory.Exists(_customPathBox.Text))
            {
                targetArg = string.Format("-location \"{0}\"", _customPathBox.Text);
            }

            string fullArgs = string.Format("{0} {1}", actionFlag, targetArg).Trim();

            AppendLog(string.Format("> NyaCordInstallerCli {0}\n", fullArgs), ColText);
            SetControlsEnabled(false);

            await Task.Run(() =>
            {
                try
                {
                    var psi = new ProcessStartInfo
                    {
                        FileName = cli,
                        Arguments = fullArgs,
                        UseShellExecute = false,
                        RedirectStandardOutput = true,
                        RedirectStandardError = true,
                        CreateNoWindow = true
                    };

                    string localDesktop = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "desktop", "patcher.js");
                    string parentDesktop = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "..", "desktop", "patcher.js");

                    if (File.Exists(localDesktop))
                    {
                        psi.EnvironmentVariables["NYACORD_DIRECTORY"] = Path.GetDirectoryName(localDesktop);
                        psi.EnvironmentVariables["NYACORD_DEV_INSTALL"] = "1";
                    }
                    else if (File.Exists(parentDesktop))
                    {
                        psi.EnvironmentVariables["NYACORD_DIRECTORY"] = Path.GetFullPath(Path.GetDirectoryName(parentDesktop));
                        psi.EnvironmentVariables["NYACORD_DEV_INSTALL"] = "1";
                    }

                    using (var proc = Process.Start(psi))
                    {
                        string line;
                        while ((line = proc.StandardOutput.ReadLine()) != null)
                        {
                            Color c = ColTextMuted;
                            if (line.Contains("Success") || line.Contains("patched") || line.Contains("Done"))
                                c = ColSuccess;
                            else if (line.Contains("Failed") || line.Contains("Error"))
                                c = ColDanger;

                            AppendLog(line + "\n", c);
                        }

                        string err = proc.StandardError.ReadToEnd();
                        if (!string.IsNullOrEmpty(err))
                        {
                            AppendLog(err + "\n", ColDanger);
                        }

                        proc.WaitForExit();
                        if (proc.ExitCode == 0)
                        {
                            AppendLog("Completed successfully! (=^･ω･^=)\n", ColSuccess);
                        }
                    }
                }
                catch (Exception ex)
                {
                    AppendLog(string.Format("Exception: {0}\n", ex.Message), ColDanger);
                }
            });

            SetControlsEnabled(true);
            ScanDiscords();
        }

        private void ToggleOpenAsar()
        {
            var selected = _discordCombo.SelectedItem as DiscordEntry;
            if (selected == null || string.IsNullOrEmpty(selected.Path))
            {
                AppendLog("Select a Discord install first.\n", ColTextMuted);
                return;
            }

            string appAsar = Path.Combine(selected.AppPath, "resources", "app.asar");
            bool hasOpenAsar = false;
            try
            {
                if (File.Exists(appAsar) && new FileInfo(appAsar).Length > 100000)
                    hasOpenAsar = true;
            }
            catch { }

            if (hasOpenAsar)
                ExecuteAction("-uninstall-openasar");
            else
                ExecuteAction("-install-openasar");
        }

        private void SetControlsEnabled(bool enabled)
        {
            Dispatcher.Invoke(() =>
            {
                _installBtn.IsEnabled = enabled;
                _repairBtn.IsEnabled = enabled;
                _uninstallBtn.IsEnabled = enabled;
                _openAsarBtn.IsEnabled = enabled;
                _discordCombo.IsEnabled = enabled;
            });
        }
    }

    public static class Program
    {
        [STAThread]
        public static void Main()
        {
            var app = new Application();
            app.Run(new MainWindow());
        }
    }
}
